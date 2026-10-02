package com.novaai.chat

import android.content.Intent
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.provider.Settings
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.Button
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity

class MainActivity : AppCompatActivity() {

    private lateinit var webView: WebView
    private lateinit var btnToggleBubble: Button

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        webView = findViewById(R.id.webView)
        btnToggleBubble = findViewById(R.id.btnToggleBubble)

        webView.settings.javaScriptEnabled = true
        webView.settings.domStorageEnabled = true
        webView.webViewClient = WebViewClient()
        webView.loadUrl(BuildConfig.WEB_APP_URL)

        btnToggleBubble.setOnClickListener {
            if (BubbleService.isRunning) {
                stopService(Intent(this, BubbleService::class.java))
                updateButtonLabel()
            } else {
                requestOverlayPermissionThenStart()
            }
        }
    }

    override fun onResume() {
        super.onResume()
        updateButtonLabel()
    }

    private fun updateButtonLabel() {
        btnToggleBubble.text = if (BubbleService.isRunning)
            getString(R.string.btn_disable_bubble) else getString(R.string.btn_enable_bubble)
    }

    private fun requestOverlayPermissionThenStart() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M && !Settings.canDrawOverlays(this)) {
            Toast.makeText(this, "Izinkan \"Tampil di atas aplikasi lain\" untuk Nova AI", Toast.LENGTH_LONG).show()
            val intent = Intent(
                Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
                Uri.parse("package:$packageName")
            )
            startActivityForResult(intent, REQ_OVERLAY)
        } else {
            startService(Intent(this, BubbleService::class.java))
            updateButtonLabel()
        }
    }

    override fun onActivityResult(requestCode: Int, resultCode: Int, data: Intent?) {
        super.onActivityResult(requestCode, resultCode, data)
        if (requestCode == REQ_OVERLAY) {
            if (Build.VERSION.SDK_INT < Build.VERSION_CODES.M || Settings.canDrawOverlays(this)) {
                startService(Intent(this, BubbleService::class.java))
                updateButtonLabel()
            } else {
                Toast.makeText(this, "Izin belum diberikan, gelembung tidak bisa diaktifkan.", Toast.LENGTH_LONG).show()
            }
        }
    }

    companion object {
        private const val REQ_OVERLAY = 1001
    }
}
