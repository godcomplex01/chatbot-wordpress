<?php
/*
Plugin Name: Roboloans Chatbot (WordPress Only) - Fixed
Plugin URI: https://roboloans.com.au
Description: Complete AI-powered car loan eligibility chatbot - No Node.js required
Version: 2.0.1
Author: Roboloans Team
License: GPL v2 or later
Text Domain: roboloans-chatbot
*/

// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}

class Roboloans_WordPress_Chatbot {
    
    public function __construct() {
        add_action('init', array($this, 'init_plugin'));
        add_action('wp_enqueue_scripts', array($this, 'enqueue_scripts'));
        add_action('wp_ajax_roboloans_submit', array($this, 'handle_form_submission'));
        add_action('wp_ajax_nopriv_roboloans_submit', array($this, 'handle_form_submission'));
        add_action('wp_footer', array($this, 'render_chatbot'));
        add_action('admin_menu', array($this, 'add_admin_menu'));
        add_action('admin_init', array($this, 'register_settings'));
        register_activation_hook(__FILE__, array($this, 'activate'));
        register_deactivation_hook(__FILE__, array($this, 'deactivate'));
    }
    
    public function init_plugin() {
        // Create custom database table
        $this->create_database_table();
    }
    
    public function activate() {
        $this->create_database_table();
        flush_rewrite_rules();
    }
    
    public function deactivate() {
        flush_rewrite_rules();
    }
    
    public function create_database_table() {
        global $wpdb;
        
        $table_name = $wpdb->prefix . 'roboloans_submissions';
        $charset_collate = $wpdb->get_charset_collate();
        
        $sql = "CREATE TABLE IF NOT EXISTS $table_name (
            id mediumint(9) NOT NULL AUTO_INCREMENT,
            submission_date datetime DEFAULT CURRENT_TIMESTAMP,
            full_name varchar(255) NOT NULL,
            email varchar(255) NOT NULL,
            mobile varchar(20),
            status varchar(50) DEFAULT 'Pending',
            data longtext,
            zoho_response longtext,
            created_at datetime DEFAULT CURRENT_TIMESTAMP,
            updated_at datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            KEY status (status),
            KEY submission_date (submission_date)
        ) $charset_collate;";
        
        require_once(ABSPATH . 'wp-admin/includes/upgrade.php');
        dbDelta($sql);
    }
    
    public function enqueue_scripts() {
        // Google Fonts
        wp_enqueue_style('roboloans-fonts', 'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');
        
        // Chatbot styles
        wp_enqueue_style('roboloans-chatbot-style', plugins_url('assets/chatbot-style.css', __FILE__), array(), '2.0.1');
        
        // FIXED: Ensure jQuery is loaded properly
        wp_enqueue_script('jquery');
        
        // Chatbot script with jQuery dependency
        wp_enqueue_script('roboloans-chatbot-script', plugins_url('assets/wordpress-chatbot-script.js', __FILE__), array('jquery'), '2.0.1', true);
        
        // Localize script
        wp_localize_script('roboloans-chatbot-script', 'roboloans_vars', array(
            'ajax_url' => admin_url('admin-ajax.php'),
            'nonce' => wp_create_nonce('roboloans_nonce'),
            'plugin_url' => plugin_dir_url(__FILE__),
            'auto_open' => get_option('roboloans_auto_open', 'yes') === 'yes',
            'delay' => get_option('roboloans_delay', '2'),
            'position' => get_option('roboloans_position', 'bottom-right'),
            'site_url' => get_site_url()
        ));
        
        // Add inline CSS fixes
        wp_add_inline_style('roboloans-chatbot-style', '
            #roboloans-chat-input {
                display: block !important;
                width: 100% !important;
                padding: 8px 12px !important;
                border: 1px solid #ddd !important;
                border-radius: 4px !important;
                background: #fff !important;
                font-size: 12px !important;
            }
            .emoji {
                font-size: 14px !important;
                line-height: 1;
                vertical-align: middle;
            }
            .choice-btn {
                cursor: pointer !important;
                transition: all 0.2s !important;
            }
            .choice-btn:hover {
                transform: translateY(-1px) !important;
                box-shadow: 0 2px 4px rgba(0,0,0,0.1) !important;
            }
        ');
    }
    
    public function render_chatbot() {
        if (get_option('roboloans_enable_site_wide', 'yes') === 'yes') {
            echo '<div id="roboloans-chatbot-root"></div>';
        }
    }
    
    public function handle_form_submission() {
        // Security check
        if (!wp_verify_nonce($_POST['nonce'], 'roboloans_nonce')) {
            wp_send_json_error(array('message' => 'Security check failed'));
        }
        
        // Get form data
        $data = $_POST['data'];
        $full_name = sanitize_text_field($data['Full_Name'] ?? '');
        $email = sanitize_email($data['Email'] ?? '');
        $mobile = sanitize_text_field($data['Mobile'] ?? '');
        
        // Validate required fields
        if (empty($full_name) || empty($email)) {
            wp_send_json_error(array('message' => 'Name and email are required'));
        }
        
        // Save to database
        global $wpdb;
        $table_name = $wpdb->prefix . 'roboloans_submissions';
        
        $result = $wpdb->insert(
            $table_name,
            array(
                'full_name' => $full_name,
                'email' => $email,
                'mobile' => $mobile,
                'status' => 'Pending',
                'data' => json_encode($data),
                'created_at' => current_time('mysql')
            ),
            array('%s', '%s', '%s', '%s', '%s', '%s')
        );
        
        if ($result === false) {
            wp_send_json_error(array('message' => 'Database error: ' . $wpdb->last_error));
        }
        
        $submission_id = $wpdb->insert_id;
        
        // Send to Zoho
        $zoho_response = $this->send_to_zoho($data);
        
        // Update database with Zoho response
        if ($zoho_response) {
            $wpdb->update(
                $table_name,
                array(
                    'status' => 'Sent to Zoho',
                    'zoho_response' => json_encode($zoho_response),
                    'updated_at' => current_time('mysql')
                ),
                array('id' => $submission_id),
                array('%s', '%s', '%s'),
                array('%d')
            );
        }
        
        // Send email notification
        $this->send_email_notification($data, $submission_id);
        
        wp_send_json_success(array(
            'message' => 'Application submitted successfully!',
            'submission_id' => $submission_id,
            'zoho_response' => $zoho_response
        ));
    }
    
    public function send_to_zoho($data) {
        $api_token = get_option('roboloans_zoho_token', '');
        if (empty($api_token)) {
            return array('error' => 'Zoho API token not configured');
        }
        
        $zoho_data = array(
            'data' => array(
                array(
                    'Name' => $data['Full_Name'] ?? 'Unknown',
                    'Email' => $data['Email'] ?? '',
                    'Mobile' => $data['Mobile'] ?? '',
                    'Chat_JSON' => json_encode($data, JSON_PRETTY_PRINT)
                )
            )
        );
        
        $response = wp_remote_post('https://www.zohoapis.com/crm/v2/Chat_JSON', array(
            'body' => json_encode($zoho_data),
            'headers' => array(
                'Content-Type' => 'application/json',
                'Authorization' => 'Zoho-oauthtoken ' . $api_token
            ),
            'timeout' => 30,
            'sslverify' => true
        ));
        
        if (is_wp_error($response)) {
            return array('error' => $response->get_error_message());
        }
        
        $body = wp_remote_retrieve_body($response);
        $status_code = wp_remote_retrieve_response_code($response);
        
        return array(
            'status_code' => $status_code,
            'body' => json_decode($body, true),
            'success' => $status_code === 201 || $status_code === 200
        );
    }
    
    public function send_email_notification($data, $submission_id) {
        $to = get_option('roboloans_notification_email', get_option('admin_email'));
        $subject = 'New Roboloans Application - #' . $submission_id;
        
        $message = "New loan application received:\n\n";
        $message .= "Application ID: #" . $submission_id . "\n";
        $message .= "Name: " . ($data['Full_Name'] ?? '') . "\n";
        $message .= "Email: " . ($data['Email'] ?? '') . "\n";
        $message .= "Mobile: " . ($data['Mobile'] ?? '') . "\n";
        $message .= "Submitted: " . current_time('mysql') . "\n\n";
        $message .= "Full Data:\n" . json_encode($data, JSON_PRETTY_PRINT);
        
        $headers = array('Content-Type: text/plain; charset=UTF-8');
        
        wp_mail($to, $subject, $message, $headers);
    }
    
    public function add_admin_menu() {
        add_menu_page(
            'Roboloans Chatbot',
            'Roboloans Chatbot',
            'manage_options',
            'roboloans-chatbot',
            array($this, 'admin_page'),
            'dashicons-format-chat',
            30
        );
        
        add_submenu_page(
            'roboloans-chatbot',
            'Submissions',
            'Submissions',
            'manage_options',
            'roboloans-submissions',
            array($this, 'submissions_page')
        );
    }
    
    public function register_settings() {
        register_setting('roboloans_settings', 'roboloans_zoho_token');
        register_setting('roboloans_settings', 'roboloans_auto_open');
        register_setting('roboloans_settings', 'roboloans_delay');
        register_setting('roboloans_settings', 'roboloans_position');
        register_setting('roboloans_settings', 'roboloans_enable_site_wide');
        register_setting('roboloans_settings', 'roboloans_notification_email');
    }
    
    public function admin_page() {
        ?>
        <div class="wrap">
            <h1>Roboloans Chatbot Settings</h1>
            
            <form method="post" action="options.php">
                <?php settings_fields('roboloans_settings'); ?>
                
                <table class="form-table">
                    <tr>
                        <th scope="row">Zoho API Token</th>
                        <td>
                            <input type="text" name="roboloans_zoho_token" value="<?php echo esc_attr(get_option('roboloans_zoho_token', '')); ?>" class="regular-text" />
                            <p class="description">Your Zoho CRM API token for Chat_JSON module</p>
                        </td>
                    </tr>
                    
                    <tr>
                        <th scope="row">Notification Email</th>
                        <td>
                            <input type="email" name="roboloans_notification_email" value="<?php echo esc_attr(get_option('roboloans_notification_email', get_option('admin_email'))); ?>" class="regular-text" />
                            <p class="description">Email to receive new application notifications</p>
                        </td>
                    </tr>
                    
                    <tr>
                        <th scope="row">Auto-Open Chat</th>
                        <td>
                            <select name="roboloans_auto_open">
                                <option value="yes" <?php selected(get_option('roboloans_auto_open', 'yes'), 'yes'); ?>>Yes</option>
                                <option value="no" <?php selected(get_option('roboloans_auto_open', 'yes'), 'no'); ?>>No</option>
                            </select>
                            <p class="description">Automatically open chat for first-time visitors</p>
                        </td>
                    </tr>
                    
                    <tr>
                        <th scope="row">Auto-Open Delay (seconds)</th>
                        <td>
                            <input type="number" name="roboloans_delay" value="<?php echo esc_attr(get_option('roboloans_delay', '2')); ?>" min="0" max="10" />
                            <p class="description">Delay before auto-opening chat (0-10 seconds)</p>
                        </td>
                    </tr>
                    
                    <tr>
                        <th scope="row">Chat Position</th>
                        <td>
                            <select name="roboloans_position">
                                <option value="bottom-right" <?php selected(get_option('roboloans_position', 'bottom-right'), 'bottom-right'); ?>>Bottom Right</option>
                                <option value="bottom-left" <?php selected(get_option('roboloans_position', 'bottom-right'), 'bottom-left'); ?>>Bottom Left</option>
                                <option value="top-right" <?php selected(get_option('roboloans_position', 'bottom-right'), 'top-right'); ?>>Top Right</option>
                                <option value="top-left" <?php selected(get_option('roboloans_position', 'bottom-right'), 'top-left'); ?>>Top Left</option>
                            </select>
                            <p class="description">Position of the chatbot on screen</p>
                        </td>
                    </tr>
                    
                    <tr>
                        <th scope="row">Site-Wide Display</th>
                        <td>
                            <select name="roboloans_enable_site_wide">
                                <option value="yes" <?php selected(get_option('roboloans_enable_site_wide', 'yes'), 'yes'); ?>>Yes (All pages)</option>
                                <option value="no" <?php selected(get_option('roboloans_enable_site_wide', 'yes'), 'no'); ?>>No (Manual placement)</option>
                            </select>
                            <p class="description">Show chatbot on all pages or use shortcode</p>
                        </td>
                    </tr>
                </table>
                
                <?php submit_button(); ?>
            </form>
            
            <h2>Usage Instructions</h2>
            <div class="card">
                <h3>Shortcode Usage</h3>
                <p>Add this shortcode to any page or post:</p>
                <code>[roboloans_chatbot]</code>
                
                <h4>Advanced Options:</h4>
                <code>[roboloans_chatbot position="bottom-right" auto_open="no"]</code>
            </div>
            
            <div class="card">
                <h3>PHP Template Usage</h3>
                <p>Add to your theme template:</p>
                <code>&lt;?php echo do_shortcode('[roboloans_chatbot]'); ?&gt;</code>
            </div>
            
            <div class="card">
                <h3>Features</h3>
                <ul>
                    <li>✅ No Node.js server required</li>
                    <li>✅ Direct Zoho CRM integration</li>
                    <li>✅ WordPress database storage</li>
                    <li>✅ Email notifications</li>
                    <li>✅ Mobile responsive</li>
                    <li>✅ Auto-open for first visitors</li>
                    <li>✅ Multiple position options</li>
                    <li>✅ Fixed jQuery issues</li>
                </ul>
            </div>
        </div>
        
        <style>
        .card {
            background: #fff;
            border: 1px solid #ccd0d4;
            border-radius: 4px;
            padding: 20px;
            margin: 20px 0;
            box-shadow: 0 1px 1px rgba(0,0,0,0.04);
        }
        .card h3 {
            margin-top: 0;
            color: #1d2327;
        }
        .card code {
            background: #f0f0f1;
            padding: 2px 6px;
            border-radius: 3px;
            font-family: monospace;
        }
        </style>
        <?php
    }
    
    public function submissions_page() {
        global $wpdb;
        $table_name = $wpdb->prefix . 'roboloans_submissions';
        
        // Handle bulk actions
        if (isset($_POST['action']) && $_POST['action'] === 'delete') {
            $ids = $_POST['submission_ids'] ?? array();
            if (!empty($ids)) {
                $ids_str = implode(',', array_map('intval', $ids));
                $wpdb->query("DELETE FROM $table_name WHERE id IN ($ids_str)");
                echo '<div class="notice notice-success"><p>Submissions deleted successfully.</p></div>';
            }
        }
        
        // Get submissions
        $submissions = $wpdb->get_results("SELECT * FROM $table_name ORDER BY created_at DESC LIMIT 50");
        
        ?>
        <div class="wrap">
            <h1>Roboloans Submissions</h1>
            
            <div class="tablenav top">
                <div class="alignleft actions">
                    <form method="post">
                        <input type="hidden" name="action" value="delete">
                        <input type="submit" class="button action" value="Delete Selected" onclick="return confirm('Are you sure?');">
                    </form>
                </div>
            </div>
            
            <table class="wp-list-table widefat fixed striped">
                <thead>
                    <tr>
                        <th scope="col" class="manage-column column-cb check-column">
                            <input type="checkbox" id="cb-select-all-1">
                        </th>
                        <th>ID</th>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Mobile</th>
                        <th>Status</th>
                        <th>Date</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    <?php foreach ($submissions as $submission): ?>
                        <tr>
                            <th scope="row" class="check-column">
                                <input type="checkbox" name="submission_ids[]" value="<?php echo $submission->id; ?>">
                            </th>
                            <td>#<?php echo $submission->id; ?></td>
                            <td><?php echo esc_html($submission->full_name); ?></td>
                            <td><?php echo esc_html($submission->email); ?></td>
                            <td><?php echo esc_html($submission->mobile); ?></td>
                            <td>
                                <span class="status-<?php echo $submission->status; ?>">
                                    <?php echo esc_html($submission->status); ?>
                                </span>
                            </td>
                            <td><?php echo date('d M Y, g:i A', strtotime($submission->created_at)); ?></td>
                            <td>
                                <button class="button" onclick="viewSubmission(<?php echo $submission->id; ?>)">View</button>
                            </td>
                        </tr>
                    <?php endforeach; ?>
                </tbody>
            </table>
        </div>
        
        <script>
        function viewSubmission(id) {
            // You can implement a modal to view full submission details
            alert('View submission #' + id);
        }
        
        // Select all checkbox functionality
        document.getElementById('cb-select-all-1').addEventListener('change', function() {
            var checkboxes = document.querySelectorAll('input[name="submission_ids[]"]');
            checkboxes.forEach(function(checkbox) {
                checkbox.checked = this.checked;
            }.bind(this));
        });
        </script>
        
        <style>
        .status-Pending { color: #d63638; }
        .status-Sent-to-Zoho { color: #00a32a; }
        </style>
        <?php
    }
}

// Initialize the plugin
new Roboloans_WordPress_Chatbot();

// Shortcode support
add_shortcode('roboloans_chatbot', function($atts) {
    $atts = shortcode_atts(array(
        'position' => get_option('roboloans_position', 'bottom-right'),
        'auto_open' => get_option('roboloans_auto_open', 'yes'),
        'delay' => get_option('roboloans_delay', '2')
    ), $atts, 'roboloans_chatbot');
    
    return '<div class="roboloans-chatbot-container" data-position="' . esc_attr($atts['position']) . '" data-auto-open="' . esc_attr($atts['auto_open']) . '" data-delay="' . esc_attr($atts['delay']) . '"></div>';
});
?>
