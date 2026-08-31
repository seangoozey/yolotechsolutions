<?php
// S&S Computer Repair - contact form handler (single canonical version)
//
// Secrets live in config.php next to this file (gitignored).
// Copy config.sample.php to config.php and fill in the reCAPTCHA secret.

ob_start();

// Security headers
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: DENY');
header('Referrer-Policy: strict-origin-when-cross-origin');

// Disable error reporting
error_reporting(0);
ini_set('display_errors', 0);

// Configuration
$sendTo = 'SandS Support <support@yolotechsolutions.com>';
$subject = 'Message from contact form.';
$okMessage = 'Contact form successfully submitted. Thank you, I will get back to you soon!';

// reCAPTCHA secret is loaded from the gitignored config file
$recaptcha_secret = '';
$configFile = __DIR__ . '/config.php';
if (is_readable($configFile)) {
    require $configFile;
}

// Send a JSON response and stop
function respond($payload) {
    if (ob_get_length()) ob_clean();
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-cache, must-revalidate');
    echo json_encode($payload);
    exit;
}

// Clean input for a plain-text email: trim and normalize, but do NOT
// HTML-encode - encoding is what put entities like &#039; in the emails.
function cleanInput($input) {
    return trim(stripslashes($input));
}

function validateEmail($email) {
    return filter_var($email, FILTER_VALIDATE_EMAIL);
}

function validatePhone($phone) {
    if (empty($phone)) return true;
    $phone = preg_replace('/[^0-9+]/', '', $phone);
    return strlen($phone) >= 10 && strlen($phone) <= 15;
}

// Inclusive name check: unicode letters and marks, apostrophes (O'Brien),
// curly apostrophes, periods, hyphens, and spaces - so real names pass.
function validateName($name) {
    return strlen($name) >= 2 && strlen($name) <= 50 && preg_match('/^[\p{L}\p{M}\'\’\.\-\s]+$/u', $name);
}

function validateMessage($message) {
    return strlen($message) >= 10 && strlen($message) <= 1000;
}

// Function to verify reCAPTCHA token
function verifyRecaptcha($token, $secret) {
    $url = 'https://www.google.com/recaptcha/api/siteverify';
    $data = array(
        'secret' => $secret,
        'response' => $token
    );

    $options = array(
        'http' => array(
            'header' => "Content-type: application/x-www-form-urlencoded\r\n",
            'method' => 'POST',
            'content' => http_build_query($data),
            'timeout' => 10
        )
    );

    $context = stream_context_create($options);
    $result = file_get_contents($url, false, $context);

    if ($result === FALSE) {
        error_log('reCAPTCHA verification failed: Could not connect to Google');
        return false;
    }

    $response = json_decode($result, true);

    if (json_last_error() !== JSON_ERROR_NONE) {
        error_log('reCAPTCHA verification failed: Invalid JSON response');
        return false;
    }

    if (!isset($response['success']) || !$response['success']) {
        error_log('reCAPTCHA verification failed: ' . (isset($response['error-codes']) ? implode(', ', $response['error-codes']) : 'Unknown error'));
        return false;
    }

    // Reject tokens generated for a different action (e.g. replayed elsewhere)
    if (isset($response['action']) && $response['action'] !== 'contact_form') {
        error_log('reCAPTCHA verification failed: unexpected action ' . $response['action']);
        return false;
    }

    return isset($response['score']) ? $response['score'] >= 0.5 : true;
}

try {
    if (empty($_POST)) {
        throw new Exception('No form data received');
    }

    if (empty($recaptcha_secret)) {
        error_log('contact.php: reCAPTCHA secret missing - copy content/config.sample.php to content/config.php');
        throw new Exception('The form is temporarily unavailable. Please call or email us directly.');
    }

    // Honeypot: the "website" field is hidden from humans; bots fill it in.
    // Answer with fake success so the bot learns nothing.
    if (!empty($_POST['website'])) {
        error_log('contact.php: honeypot triggered - bot submission dropped');
        respond(array('type' => 'success', 'message' => $okMessage));
    }

    // Verify reCAPTCHA token
    if (!isset($_POST['recaptcha_token']) || empty($_POST['recaptcha_token'])) {
        throw new Exception('reCAPTCHA token is missing');
    }

    if (!verifyRecaptcha($_POST['recaptcha_token'], $recaptcha_secret)) {
        throw new Exception('reCAPTCHA verification failed. Please try again.');
    }

    // Clean inputs (no HTML encoding - see cleanInput)
    $name = isset($_POST['name']) ? cleanInput($_POST['name']) : '';
    $surname = isset($_POST['surname']) ? cleanInput($_POST['surname']) : '';
    $email = isset($_POST['email']) ? cleanInput($_POST['email']) : '';
    $phone = isset($_POST['phone']) ? cleanInput($_POST['phone']) : '';
    $message = isset($_POST['message']) ? cleanInput($_POST['message']) : '';

    // Validate all fields
    if (!validateName($name)) {
        throw new Exception('Please enter a valid first name (2-50 characters)');
    }

    if (!validateName($surname)) {
        throw new Exception('Please enter a valid last name (2-50 characters)');
    }

    if (!validateEmail($email)) {
        throw new Exception('Please enter a valid email address');
    }

    if (!validatePhone($phone)) {
        throw new Exception('Please enter a valid phone number');
    }

    if (!validateMessage($message)) {
        throw new Exception('Message must be between 10 and 1000 characters');
    }

    // Compose the message
    $emailText = "You have a new message from your contact form\n=============================\n";
    $emailText .= "Name: $name $surname\n";
    $emailText .= "Email: $email\n";
    $emailText .= "Phone: " . ($phone ? $phone : 'Not provided') . "\n";
    $emailText .= "Message: $message\n";

    // Audit trail: what actually reached the inbox (keeps the error log readable)
    error_log('contact.php submission sent: name=' . $name . ' ' . $surname
        . ', email=' . $email
        . ', phone=' . ($phone ? $phone : 'none')
        . ', ip=' . (isset($_SERVER['REMOTE_ADDR']) ? $_SERVER['REMOTE_ADDR'] : 'unknown'));

    // Email headers - the From address must be a real mailbox on this domain (Bluehost)
    $headers = array(
        'Content-Type: text/plain; charset="UTF-8";',
        'From: Contact Form <support@yolotechsolutions.com>',
        'Reply-To: ' . $email,
        'X-Mailer: PHP/' . PHP_VERSION,
        'X-Contact-Form: S&S Computer Repair'
    );

    // Send email
    if (mail($sendTo, $subject, $emailText, implode("\r\n", $headers))) {
        $responseArray = array('type' => 'success', 'message' => $okMessage);
    } else {
        throw new Exception('Failed to send email');
    }
} catch (\Exception $e) {
    $responseArray = array('type' => 'danger', 'message' => $e->getMessage());
}

respond($responseArray);
?>
