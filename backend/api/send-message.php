<?php
// File: backend/api/send-message.php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

// ============ CONFIGURATION - EDIT THESE ============
// Your Gmail credentials (use App Password for security)
$smtp_host = 'smtp.gmail.com';
$smtp_port = 587;
$smtp_username = 'nathanfernando045@gmail.com';  // Your Gmail
$smtp_password = 'yhxe eeyc amjy vcgk';  // NOT your regular password! Get from Google
$to_email = 'nathanfernando045@gmail.com';  // Where messages go
// ===================================================

// Get the POST data
$data = json_decode(file_get_contents('php://input'), true);

if (!$data) {
    echo json_encode(['success' => false, 'message' => 'No data received']);
    exit;
}

// Sanitize and validate input
$name = isset($data['name']) ? trim($data['name']) : '';
$email = isset($data['email']) ? trim($data['email']) : '';
$subject = isset($data['subject']) ? trim($data['subject']) : '';
$message = isset($data['message']) ? trim($data['message']) : '';

// Validation
$errors = [];

if (empty($name)) {
    $errors[] = 'Name is required';
}

if (empty($email)) {
    $errors[] = 'Email is required';
} elseif (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    $errors[] = 'Invalid email format';
}

if (empty($message)) {
    $errors[] = 'Message is required';
}

if (!empty($errors)) {
    echo json_encode(['success' => false, 'message' => implode(', ', $errors)]);
    exit;
}

// Email content
$email_subject = $subject ?: "New Contact Form Message from $name";
$email_message = "
<html>
<head>
    <title>New Message from Portfolio Contact Form</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #4f46e5; color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; }
        .footer { background: #f3f4f6; padding: 15px; text-align: center; font-size: 12px; color: #6b7280; border-radius: 0 0 10px 10px; }
        .field { margin-bottom: 20px; }
        .field-label { font-weight: bold; color: #4f46e5; margin-bottom: 5px; }
        .field-value { background: white; padding: 10px; border-radius: 8px; border: 1px solid #e5e7eb; }
    </style>
</head>
<body>
    <div class='container'>
        <div class='header'>
            <h2>📬 New Message from Your Portfolio</h2>
        </div>
        <div class='content'>
            <div class='field'>
                <div class='field-label'>👤 Name:</div>
                <div class='field-value'>" . htmlspecialchars($name) . "</div>
            </div>
            <div class='field'>
                <div class='field-label'>📧 Email:</div>
                <div class='field-value'>" . htmlspecialchars($email) . "</div>
            </div>
            <div class='field'>
                <div class='field-label'>📝 Subject:</div>
                <div class='field-value'>" . htmlspecialchars($subject ?: 'No Subject') . "</div>
            </div>
            <div class='field'>
                <div class='field-label'>💬 Message:</div>
                <div class='field-value'>" . nl2br(htmlspecialchars($message)) . "</div>
            </div>
        </div>
        <div class='footer'>
            <p>This message was sent from your portfolio website contact form.</p>
            <p>IP Address: " . $_SERVER['REMOTE_ADDR'] . " | Time: " . date('Y-m-d H:i:s') . "</p>
        </div>
    </div>
</body>
</html>
";

// Auto-reply content for the sender
$auto_reply_subject = "Thank you for contacting Nathan Fernando";
$auto_reply_message = "
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 500px; margin: 0 auto; padding: 20px; }
        .header { background: #4f46e5; color: white; padding: 15px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; }
        .footer { background: #f3f4f6; padding: 10px; text-align: center; font-size: 11px; color: #6b7280; border-radius: 0 0 10px 10px; }
    </style>
</head>
<body>
    <div class='container'>
        <div class='header'>
            <h2>Thank You for Reaching Out! 🙏</h2>
        </div>
        <div class='content'>
            <p>Dear " . htmlspecialchars($name) . ",</p>
            <p>I have received your message and will get back to you within 24-48 hours.</p>
            <p><strong>Your message was:</strong></p>
            <div style='background: white; padding: 15px; border-radius: 8px; border-left: 4px solid #4f46e5;'>
                " . nl2br(htmlspecialchars($message)) . "
            </div>
            <p>Best regards,<br><strong>Nathan Maneth Fernando</strong><br>Software Engineering Student | SLIIT City Uni</p>
        </div>
        <div class='footer'>
            <p>This is an automated confirmation. Please do not reply to this email.</p>
        </div>
    </div>
</body>
</html>
";

// Function to send email using SMTP
function sendSMTPMail($to, $subject, $message, $from_name, $from_email, $smtp_config) {
    require_once 'PHPMailer/PHPMailer.php';
    require_once 'PHPMailer/SMTP.php';
    require_once 'PHPMailer/Exception.php';
    
    $mail = new PHPMailer\PHPMailer\PHPMailer(true);
    
    try {
        // Server settings
        $mail->isSMTP();
        $mail->Host = $smtp_config['host'];
        $mail->SMTPAuth = true;
        $mail->Username = $smtp_config['username'];
        $mail->Password = $smtp_config['password'];
        $mail->SMTPSecure = PHPMailer\PHPMailer\PHPMailer::ENCRYPTION_STARTTLS;
        $mail->Port = $smtp_config['port'];
        $mail->CharSet = 'UTF-8';
        
        // Recipients
        $mail->setFrom($smtp_config['username'], $from_name);
        $mail->addReplyTo($from_email, $from_name);
        $mail->addAddress($to);
        
        // Content
        $mail->isHTML(true);
        $mail->Subject = $subject;
        $mail->Body = $message;
        $mail->AltBody = strip_tags($message);
        
        $mail->send();
        return true;
    } catch (Exception $e) {
        error_log("Email sending failed: " . $mail->ErrorInfo);
        return false;
    }
}

// SMTP Configuration
$smtp_config = [
    'host' => $smtp_host,
    'port' => $smtp_port,
    'username' => $smtp_username,
    'password' => $smtp_password
];

// Send the main email to you
$main_sent = sendSMTPMail($to_email, $email_subject, $email_message, $name, $email, $smtp_config);

// Send auto-reply to the person who contacted you
$auto_reply_sent = sendSMTPMail($email, $auto_reply_subject, $auto_reply_message, 'Nathan Fernando', $to_email, $smtp_config);

if ($main_sent) {
    echo json_encode(['success' => true, 'message' => 'Message sent successfully!']);
} else {
    echo json_encode(['success' => false, 'message' => 'Failed to send message. Please try again or contact directly via email.']);
}
?>