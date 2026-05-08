<?php
/*
Plugin Name: Roboloans Chatbot - Clean Version
Plugin URI: https://roboloans.com.au
Description: Complete AI-powered car loan eligibility chatbot - External Server Version
Version: 2.1.0
Author: Roboloans Team
License: GPL v2 or later
Text Domain: roboloans-chatbot
*/

// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}

class Roboloans_Chatbot_Clean {
    
    public function __construct() {
        add_action('init', array($this, 'init_plugin'));
        add_action('wp_enqueue_scripts', array($this, 'enqueue_scripts'));
        add_action('wp_footer', array($this, 'render_chatbot'));
        add_action('admin_menu', array($this, 'add_admin_menu'));
        add_action('admin_init', array($this, 'register_settings'));
        register_activation_hook(__FILE__, array($this, 'activate'));
        register_deactivation_hook(__FILE__, array($this, 'deactivate'));
    }
    
    public function init_plugin() {
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
        wp_enqueue_style('roboloans-chatbot-style', plugins_url('chatbot-style.css', __FILE__), array(), '2.1.0');
        
        // Chatbot script - EXTERNAL VERSION
        wp_enqueue_script('roboloans-chatbot-script', plugins_url('wordpress-chatbot-script.js', __FILE__), array('jquery'), '2.1.0', true);
        
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
    }
    
    public function render_chatbot() {
        if (get_option('roboloans_enable_site_wide', 'yes') === 'yes') {
            echo '<div id="roboloans-chatbot-root"></div>';
        }
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
    }
    
    public function register_settings() {
        register_setting('roboloans_settings', 'roboloans_auto_open');
        register_setting('roboloans_settings', 'roboloans_delay');
        register_setting('roboloans_settings', 'roboloans_position');
        register_setting('roboloans_settings', 'roboloans_enable_site_wide');
    }
    
    public function admin_page() {
        ?>
        <div class="wrap">
            <h1>Roboloans Chatbot Settings</h1>
            
            <form method="post" action="options.php">
                <?php settings_fields('roboloans_settings'); ?>
                
                <table class="form-table">
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
            
            <h2>External Server Status</h2>
            <div class="card">
                <h3>Server Connection</h3>
                <p>External server should be running at: <code>http://localhost:3000</code></p>
                <p>Admin panel: <a href="http://localhost:3000/admin" target="_blank">http://localhost:3000/admin</a></p>
                <p>API endpoint: <code>http://localhost:3000/api/submit</code></p>
            </div>
            
            <div class="card">
                <h3>Features</h3>
                <ul>
                    <li>✅ External Node.js server</li>
                    <li>✅ Direct Zoho CRM integration</li>
                    <li>✅ WordPress database storage</li>
                    <li>✅ Email notifications</li>
                    <li>✅ Mobile responsive</li>
                    <li>✅ Auto-open for first visitors</li>
                    <li>✅ Multiple position options</li>
                    <li>✅ External server bypass</li>
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
}

// Initialize the plugin
new Roboloans_Chatbot_Clean();

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
