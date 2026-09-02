<?php
/**
 * send-mail.php
 * Envoie les messages des formulaires du site Mameho via le SMTP d'OVH.
 * A placer à la racine de l'hébergement (à côté de index.html).
 */

header('Content-Type: application/json; charset=utf-8');

// ── CONFIGURATION — à compléter ────────────────────────────────
$SMTP_HOST = 'ssl0.ovh.net';
$SMTP_PORT = 465;                       // 465 = SSL direct (recommandé)
$SMTP_USER = 'a.marsaux@mameho.fr';     // boîte OVH utilisée pour l'envoi
$SMTP_PASS = '27Aout1996.'; // ⚠️ mot de passe de la boîte mail OVH
$MAIL_TO   = 'a.marsaux@mameho.fr';     // destinataire des messages du site
// ────────────────────────────────────────────────────────────────

// N'accepte que du POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['ok' => false, 'error' => 'Méthode non autorisée']);
    exit;
}

// Lecture des données envoyées en JSON par le site
$raw  = file_get_contents('php://input');
$data = json_decode($raw, true) ?: $_POST;

function clean($v) {
    return trim(str_replace(["\r", "\n"], ' ', (string) ($v ?? '')));
}

$type        = clean($data['type'] ?? 'info');
$nom         = clean($data['nom'] ?? '');
$emailClient = clean($data['email'] ?? '');
$telephone   = clean($data['telephone'] ?? '');
$entreprise  = clean($data['entreprise'] ?? '');
$message     = trim((string) ($data['message'] ?? ''));

// Validation minimale côté serveur (ne fait pas confiance au JS seul)
if ($nom === '' || $emailClient === '' || !filter_var($emailClient, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'Nom ou email invalide']);
    exit;
}

$typeLabels = [
    'info'      => 'Demande de renseignements',
    'prix'      => 'Demande de tarifs',
    'revendeur' => 'Demande partenariat revendeur',
];
$sujetType = $typeLabels[$type] ?? 'Nouveau message';

$subject = "[Mameho] $sujetType — $nom";

$bodyLines = [
    "Type de demande : $sujetType",
    "Nom : $nom",
    "Email : $emailClient",
];
if ($telephone !== '')  $bodyLines[] = "Téléphone : $telephone";
if ($entreprise !== '') $bodyLines[] = "Entreprise / Enseigne : $entreprise";
$bodyLines[] = '';
$bodyLines[] = 'Message :';
$bodyLines[] = $message;

$body = implode("\r\n", $bodyLines);

$result = smtp_send(
    $SMTP_HOST, $SMTP_PORT, $SMTP_USER, $SMTP_PASS,
    $SMTP_USER, $MAIL_TO, $subject, $body, $emailClient, $nom
);

if ($result === true) {
    echo json_encode(['ok' => true]);
} else {
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => $result]);
}

/**
 * Envoie un email en dialoguant directement avec le serveur SMTP OVH.
 * Retourne true si succès, ou une chaîne d'erreur sinon.
 */
function smtp_send($host, $port, $user, $pass, $from, $to, $subject, $body, $replyTo, $replyName) {
    $timeout = 15;
    $socket = @stream_socket_client(
        "ssl://$host:$port", $errno, $errstr, $timeout
    );
    if (!$socket) {
        return "Connexion SMTP impossible : $errstr ($errno)";
    }

    $read = function () use ($socket) {
        $data = '';
        while ($line = fgets($socket, 515)) {
            $data .= $line;
            if (isset($line[3]) && $line[3] === ' ') break;
        }
        return $data;
    };
    $write = function ($cmd) use ($socket) {
        fwrite($socket, $cmd . "\r\n");
    };

    $read(); // greeting

    $write("EHLO mameho.fr");
    $read();

    $write("AUTH LOGIN");
    $read();
    $write(base64_encode($user));
    $read();
    $write(base64_encode($pass));
    $authResp = $read();
    if (strpos($authResp, '235') !== 0) {
        fclose($socket);
        return "Authentification SMTP échouée : $authResp";
    }

    $write("MAIL FROM:<$from>");
    $read();
    $write("RCPT TO:<$to>");
    $read();
    $write("DATA");
    $read();

    $headers = [];
    $headers[] = "From: Site Mameho <$from>";
    $headers[] = "To: <$to>";
    $headers[] = "Reply-To: " . mb_encode_mimeheader($replyName, 'UTF-8') . " <$replyTo>";
    $headers[] = "Subject: " . mb_encode_mimeheader($subject, 'UTF-8');
    $headers[] = "MIME-Version: 1.0";
    $headers[] = "Content-Type: text/plain; charset=UTF-8";
    $headers[] = "Date: " . date('r');

    // Échapper les lignes commençant par un point (règle SMTP)
    $escapedBody = preg_replace('/^\./m', '..', $body);

    $write(implode("\r\n", $headers) . "\r\n\r\n" . $escapedBody . "\r\n.");
    $sendResp = $read();

    $write("QUIT");
    fclose($socket);

    if (strpos($sendResp, '250') !== 0) {
        return "Envoi refusé par le serveur : $sendResp";
    }

    return true;
}