<?php
   // Security headers
   header('X-Content-Type-Options: nosniff');
   header('X-Frame-Options: DENY');
   header('X-XSS-Protection: 1; mode=block');
   header('Referrer-Policy: strict-origin-when-cross-origin');
   header('Content-Security-Policy: default-src \'self\'; script-src \'self\' \'unsafe-inline\' https://www.google.com https://www.gstatic.com; style-src \'self\' \'unsafe-inline\' https://fonts.googleapis.com https://cdnjs.cloudflare.com; font-src \'self\' https://fonts.gstatic.com; img-src \'self\' data: https:; connect-src \'self\' https://www.google.com;');

   // configure
   // an email address that will be in the From field of the email.
   $from = 'Contact Form <support@yolotechsolutions.com>';

   // an email address that will receive the email with the output of the form
   $sendTo = 'SandS Support <support@yolotechsolutions.com>';

   // subject of the email
   $subject = 'Message from contact form.';

   // form field names and their translations.
   // array variable name => Text to appear in the email
   $fields = array('name' => 'Name', 'surname' => 'Surname', 'phone' => 'Phone', 'email' => 'Email', 'message' => 'Message');

   // message that will be displayed when everything is OK :)
   $okMessage = 'Contact form successfully submitted. Thank you, I will get back to you soon!';

   // If something goes wrong, we will display this message.
   $errorMessage = 'There was an error while submitting the form. Please try again later';

   // reCAPTCHA Enterprise v3 configuration
   $recaptcha_secret = '6Leg-rorAAAAAPDEfdwEGFWKetkos6ePS0gPobD9';
   $recaptcha_site_key = '6Leg-rorAAAAAHmNOisI0o5uQyx4YN1dDrSutJDr';

   // if you are not debugging and don't need error reporting, turn this off by error_reporting(0);
   error_reporting(E_ALL & ~E_NOTICE);

   // Rate limiting - simple implementation
   session_start();
   $current_time = time();
   $rate_limit_window = 300; // 5 minutes
   $max_requests = 3; // Max 3 requests per 5 minutes
   
   if (isset($_SESSION['form_submissions'])) {
       // Clean old submissions
       $_SESSION['form_submissions'] = array_filter($_SESSION['form_submissions'], function($timestamp) use ($current_time, $rate_limit_window) {
           return ($current_time - $timestamp) < $rate_limit_window;
       });
       
       // Check rate limit
       if (count($_SESSION['form_submissions']) >= $max_requests) {
           $responseArray = array('type' => 'danger', 'message' => 'Too many form submissions. Please wait a few minutes before trying again.');
           header('Content-Type: application/json');
           echo json_encode($responseArray);
           exit;
       }
   } else {
       $_SESSION['form_submissions'] = array();
   }

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
       if (empty($phone)) return true; // Phone is optional
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
            'content' => http_build_query($data)
         )
      );

      $context = stream_context_create($options);
      $result = file_get_contents($url, false, $context);
      
      if ($result === FALSE) {
         return false;
      }

      $response = json_decode($result, true);
      return $response['success'] && $response['score'] >= 0.5; // Score threshold of 0.5
   }

   try {
      if (!empty($_POST)) {
         // Debug: Log what we received
         error_log('POST data received: ' . print_r($_POST, true));
         
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

         // Record this submission for rate limiting
         $_SESSION['form_submissions'][] = $current_time;

         // Compose the message
         $emailText = "You have a new message from your contact form\n=============================\n";
         $emailText .= "Name: $name $surname\n";
         $emailText .= "Email: $email\n";
         $emailText .= "Phone: " . ($phone ? $phone : 'Not provided') . "\n";
         $emailText .= "Message: $message\n";
      
         // All the neccessary headers for the email.
         $headers = array('Content-Type: text/plain; charset="UTF-8";',
               'From: ' . $from,
               'Reply-To: ' . $email,
               'Return-Path: ' . $from
         );
         
         // Send email
         if (mail($sendTo, $subject, $emailText, implode("\n", $headers))) {
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
   
   // Always return JSON response
   header('Content-Type: application/json');
   echo json_encode($responseArray);
   exit;
?>