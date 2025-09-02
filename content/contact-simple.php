<?php
// Simplified contact form without session dependencies
ob_start();

// Security headers
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: DENY');
header('X-XSS-Protection: 1; mode=block');

// Disable error reporting
error_reporting(0);
ini_set('display_errors', 0);

// Configuration
$from = 'Contact Form <yolotech@box5292.bluehost.com>';
$sendTo = 'SandS Support <support@yolotechsolutions.com>';
$subject = 'Message from contact form.';
$okMessage = 'Contact form successfully submitted. Thank you, I will get back to you soon!';

// reCAPTCHA configuration
$recaptcha_secret = '6Leg-rorAAAAAPDEfdwEGFWKetkos6ePS0gPobD9';

// Input sanitization function
function sanitizeInput($input) {
    $input = trim($input);
    $input = stripslashes($input);
    $input = htmlspecialchars($input, ENT_QUOTES, 'UTF-8');
    return $input;
}

// Validation functions
function validateEmail($email) {
    return filter_var($email, FILTER_VALIDATE_EMAIL);
}

function validatePhone($phone) {
    if (empty($phone)) return true;
    $phone = preg_replace('/[^0-9+]/', '', $phone);
    return strlen($phone) >= 10 && strlen($phone) <= 15;
}

function validateName($name) {
    return strlen($name) >= 2 && strlen($name) <= 50 && preg_match('/^[a-zA-Z\s\-\.]+$/', $name);
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
    
    return $response['score'] >= 0.5;
}

try {
    if (!empty($_POST)) {
        
        // Verify reCAPTCHA token
        if (!isset($_POST['recaptcha_token']) || empty($_POST['recaptcha_token'])) {
            throw new Exception('reCAPTCHA token is missing');
        }

        if (!verifyRecaptcha($_POST['recaptcha_token'], $recaptcha_secret)) {
            throw new Exception('reCAPTCHA verification failed. Please try again.');
        }

        // Sanitize and validate all inputs
        $name = isset($_POST['name']) ? sanitizeInput($_POST['name']) : '';
        $surname = isset($_POST['surname']) ? sanitizeInput($_POST['surname']) : '';
        $email = isset($_POST['email']) ? sanitizeInput($_POST['email']) : '';
        $phone = isset($_POST['phone']) ? sanitizeInput($_POST['phone']) : '';
        $message = isset($_POST['message']) ? sanitizeInput($_POST['message']) : '';

        // Validate all fields
        if (!validateName($name)) {
            throw new Exception('Please enter a valid first name (2-50 characters, letters only)');
        }

        if (!validateName($surname)) {
            throw new Exception('Please enter a valid last name (2-50 characters, letters only)');
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

        // Check for suspicious content
        $suspicious_patterns = array(
            '/http[s]?:\/\//i',
            '/www\./i',
            '/script/i',
            '/javascript/i',
            '/onclick/i',
            '/onload/i',
            '/eval\(/i',
            '/document\./i'
        );

        foreach ($suspicious_patterns as $pattern) {
            if (preg_match($pattern, $message)) {
                throw new Exception('Message contains suspicious content');
            }
        }

        // Compose the message
        $emailText = "You have a new message from your contact form\n=============================\n";
        $emailText .= "Name: $name $surname\n";
        $emailText .= "Email: $email\n";
        $emailText .= "Phone: " . ($phone ? $phone : 'Not provided') . "\n";
        $emailText .= "Message: $message\n";
     
        // Email headers - optimized for Bluehost
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
    } else {
        throw new Exception('No form data received');
    }
} catch (\Exception $e) {
    $responseArray = array('type' => 'danger', 'message' => $e->getMessage());
}

// Ensure no output before JSON response
if (ob_get_length()) ob_clean();

// Always return JSON response
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-cache, must-revalidate');
echo json_encode($responseArray);
exit;
?>
