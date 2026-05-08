<?php
/*
Plugin Name: Roboloans Chatbot
Plugin URI: https://roboloans.com.au
Description: AI-powered car loan eligibility chatbot for Roboloans
Version: 1.0.0
Author: Roboloans Team
License: GPL v2 or later
Text Domain: roboloans-chatbot
*/

// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}

class Roboloans_Chatbot {
    
    public function __construct() {
        add_action('wp_enqueue_scripts', array($this, 'enqueue_scripts'));
        add_shortcode('roboloans_chatbot', array($this, 'render_chatbot'));
        add_action('wp_footer', array($this, 'add_chatbot_html'));
        add_action('admin_menu', array($this, 'add_admin_menu'));
        add_action('admin_init', array($this, 'register_settings'));
    }
    
    public function enqueue_scripts() {
        // Enqueue Google Fonts
        wp_enqueue_style('roboloans-fonts', 'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');
        
        // Enqueue chatbot styles
        wp_enqueue_style('roboloans-chatbot-style', plugin_dir_url(__FILE__) . 'assets/chatbot-style.css', array(), '1.0.0');
        
        // Enqueue chatbot script
        wp_enqueue_script('roboloans-chatbot-script', plugin_dir_url(__FILE__) . 'assets/chatbot-script.js', array(), '1.0.0', true);
        
        // Localize script with WordPress data
        wp_localize_script('roboloans-chatbot-script', 'roboloans_vars', array(
            'ajax_url' => admin_url('admin-ajax.php'),
            'plugin_url' => plugin_dir_url(__FILE__),
            'server_url' => get_option('roboloans_server_url', 'http://localhost:3000'),
            'auto_open' => get_option('roboloans_auto_open', 'yes') === 'yes'
        ));
    }
    
    public function render_chatbot($atts) {
        $atts = shortcode_atts(array(
            'position' => 'bottom-right',
            'auto_open' => 'yes',
            'delay' => '2'
        ), $atts, 'roboloans_chatbot');
        
        ob_start();
        ?>
        <div class="roboloans-chatbot-container" data-position="<?php echo esc_attr($atts['position']); ?>" data-auto-open="<?php echo esc_attr($atts['auto_open']); ?>" data-delay="<?php echo esc_attr($atts['delay']); ?>">
            <!-- Chatbot will be rendered here -->
        </div>
        <?php
        return ob_get_clean();
    }
    
    public function add_chatbot_html() {
        if (get_option('roboloans_enable_site_wide', 'yes') === 'yes') {
            echo '<div id="roboloans-chatbot-root"></div>';
        }
    }
    
    public function add_admin_menu() {
        add_options_page(
            'Roboloans Chatbot Settings',
            'Roboloans Chatbot',
            'manage_options',
            'roboloans-chatbot',
            array($this, 'admin_page')
        );
    }
    
    public function register_settings() {
        register_setting('roboloans_chatbot_settings', 'roboloans_server_url');
        register_setting('roboloans_chatbot_settings', 'roboloans_auto_open');
        register_setting('roboloans_chatbot_settings', 'roboloans_enable_site_wide');
        register_setting('roboloans_chatbot_settings', 'roboloans_api_token');
    }
    
    public function admin_page() {
        ?>
        <div class="wrap">
            <h1>Roboloans Chatbot Settings</h1>
            
            <form method="post" action="options.php">
                <?php settings_fields('roboloans_chatbot_settings'); ?>
                
                <table class="form-table">
                    <tr>
                        <th scope="row">Server URL</th>
                        <td>
                            <input type="text" name="roboloans_server_url" value="<?php echo esc_attr(get_option('roboloans_server_url', 'http://localhost:3000')); ?>" class="regular-text" />
                            <p class="description">URL where your Node.js server is running</p>
                        </td>
                    </tr>
                    
                    <tr>
                        <th scope="row">Zoho API Token</th>
                        <td>
                            <input type="text" name="roboloans_api_token" value="<?php echo esc_attr(get_option('roboloans_api_token', '')); ?>" class="regular-text" />
                            <p class="description">Your Zoho CRM API token</p>
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
                        <th scope="row">Site-Wide Display</th>
                        <td>
                            <select name="roboloans_enable_site_wide">
                                <option value="yes" <?php selected(get_option('roboloans_enable_site_wide', 'yes'), 'yes'); ?>>Yes</option>
                                <option value="no" <?php selected(get_option('roboloans_enable_site_wide', 'yes'), 'no'); ?>>No (use shortcode only)</option>
                            </select>
                            <p class="description">Show chatbot on all pages or only with shortcode</p>
                        </td>
                    </tr>
                </table>
                
                <?php submit_button(); ?>
            </form>
            
            <h2>Usage Instructions</h2>
            <h3>Method 1: Site-Wide (Recommended)</h3>
            <p>Enable "Site-Wide Display" above to show the chatbot on all pages.</p>
            
            <h3>Method 2: Shortcode</h3>
            <p>Add this shortcode to any page or post:</p>
            <code>[roboloans_chatbot]</code>
            
            <h3>Method 3: HTML Block</h3>
            <p>Use the HTML block and paste the code from <code>wordpress-chatbot.html</code></p>
            
            <h3>Method 4: PHP Template</h3>
            <p>Add this PHP code to your theme template:</p>
            <code>&lt;?php echo do_shortcode('[roboloans_chatbot]'); ?&gt;</code>
        </div>
        <?php
    }
}

// Initialize the plugin
new Roboloans_Chatbot();

// AJAX handler for form submissions
add_action('wp_ajax_roboloans_submit', 'roboloans_handle_submit');
add_action('wp_ajax_nopriv_roboloans_submit', 'roboloans_handle_submit');

function roboloans_handle_submit() {
    // Verify nonce for security
    if (!wp_verify_nonce($_POST['nonce'], 'roboloans_nonce')) {
        wp_die('Security check failed');
    }
    
    // Get form data
    $data = $_POST['data'];
    
    // Send to your Node.js server
    $server_url = get_option('roboloans_server_url', 'http://localhost:3000');
    $response = wp_remote_post($server_url . '/send-to-zoho', array(
        'body' => json_encode(array('data' => $data)),
        'headers' => array(
            'Content-Type' => 'application/json',
        ),
        'timeout' => 30
    ));
    
    if (is_wp_error($response)) {
        wp_send_json_error(array('message' => 'Server error: ' . $response->get_error_message()));
    } else {
        $body = wp_remote_retrieve_body($response);
        wp_send_json_success(json_decode($body, true));
    }
}
?>
