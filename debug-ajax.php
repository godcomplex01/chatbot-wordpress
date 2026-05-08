<?php
/*
Plugin Name: Debug AJAX Test
Description: Simple AJAX test to debug chatbot
*/

// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}

class Debug_AJAX_Test {
    
    public function __construct() {
        add_action('wp_enqueue_scripts', array($this, 'enqueue_scripts'));
        add_action('wp_ajax_test_chatbot', array($this, 'handle_test'));
        add_action('wp_ajax_nopriv_test_chatbot', array($this, 'handle_test'));
        add_action('wp_footer', array($this, 'render_test'));
    }
    
    public function enqueue_scripts() {
        wp_enqueue_script('jquery');
        
        // Inline test script
        $test_script = '
        <script>
        jQuery(document).ready(function($) {
            console.log("Debug script loaded");
            
            // Test AJAX
            $("#test-ajax-btn").click(function() {
                console.log("Testing AJAX...");
                
                $.ajax({
                    url: ajaxurl,
                    type: "POST",
                    data: {
                        action: "test_chatbot",
                        test_data: "Hello from test!"
                    },
                    success: function(response) {
                        console.log("AJAX Success:", response);
                        $("#test-result").html("Response: " + JSON.stringify(response));
                    },
                    error: function(xhr, status, error) {
                        console.log("AJAX Error:", error);
                        $("#test-result").html("Error: " + error);
                    }
                });
            });
        });
        </script>';
        
        wp_add_inline_script('jquery', $test_script);
    }
    
    public function render_test() {
        echo '<div style="padding: 20px; background: #f0f0f1; margin: 20px;">';
        echo '<h3>AJAX Debug Test</h3>';
        echo '<button id="test-ajax-btn" style="padding: 10px; background: #0073aa; color: white; border: none; cursor: pointer;">Test AJAX</button>';
        echo '<div id="test-result" style="margin-top: 10px; padding: 10px; background: white; border: 1px solid #ccc;"></div>';
        echo '</div>';
    }
    
    public function handle_test() {
        echo "AJAX handler working!";
        wp_die();
    }
}

new Debug_AJAX_Test();
?>
