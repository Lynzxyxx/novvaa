package com.novaai.chat

import android.app.Activity
import android.content.Intent
import android.media.projection.MediaProjectionManager
import android.os.Bundle

/**
 * Activity transparan, tidak punya UI sendiri. Satu-satunya tugasnya:
 * memicu dialog izin screen-capture bawaan Android (WAJIB ditanya ulang
 * setiap sesi oleh sistem -- Nova AI tidak bisa melewati ini), lalu
 * langsung mengirim hasil izin itu ke BubbleService supaya screenshot
 * diambil otomatis saat itu juga. Tidak ada input manual dari pengguna.
 */
class ScreenCaptureActivity : Activity() {

    private lateinit var projectionManager: MediaProjectionManager

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        projectionManager = getSystemService(MEDIA_PROJECTION_SERVICE) as MediaProjectionManager
        startActivityForResult(projectionManager.createScreenCaptureIntent(), REQ_CODE)
    }

    override fun onActivityResult(requestCode: Int, resultCode: Int, data: Intent?) {
        super.onActivityResult(requestCode, resultCode, data)
        if (requestCode == REQ_CODE) {
            if (resultCode == RESULT_OK && data != null) {
                val serviceIntent = Intent(this, BubbleService::class.java).apply {
                    action = BubbleService.ACTION_START_CAPTURE
                    putExtra(BubbleService.EXTRA_RESULT_CODE, resultCode)
                    putExtra(BubbleService.EXTRA_RESULT_DATA, data)
                }
                startService(serviceIntent)
            } else {
                // Pengguna menolak izin -- beri tahu lewat broadcast ringan ke service
                val serviceIntent = Intent(this, BubbleService::class.java).apply {
                    action = BubbleService.ACTION_CAPTURE_DENIED
                }
                startService(serviceIntent)
            }
        }
        finish()
        overridePendingTransition(0, 0)
    }

    companion object {
        private const val REQ_CODE = 2001
    }
}
