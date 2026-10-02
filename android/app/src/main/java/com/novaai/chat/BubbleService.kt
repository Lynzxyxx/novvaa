package com.novaai.chat

import android.app.*
import android.content.Context
import android.content.Intent
import android.content.pm.ServiceInfo
import android.graphics.Bitmap
import android.graphics.PixelFormat
import android.hardware.display.DisplayManager
import android.media.Image
import android.media.ImageReader
import android.media.projection.MediaProjection
import android.media.projection.MediaProjectionManager
import android.os.Build
import android.os.Handler
import android.os.HandlerThread
import android.os.IBinder
import android.util.DisplayMetrics
import android.view.Gravity
import android.view.LayoutInflater
import android.view.MotionEvent
import android.view.View
import android.view.WindowManager
import android.widget.ImageView
import android.widget.LinearLayout
import android.widget.ProgressBar
import android.widget.TextView
import android.widget.Toast
import androidx.core.app.NotificationCompat
import com.google.mlkit.vision.common.InputImage
import com.google.mlkit.vision.text.TextRecognition
import com.google.mlkit.vision.text.latin.TextRecognizerOptions
import kotlinx.coroutines.*
import kotlinx.coroutines.tasks.await
import kotlin.math.abs

/**
 * Service untuk gelembung mengambang Nova AI.
 *
 * Alurnya: tampil sebagai ikon bulat -> tap buka panel kecil (Scan Layar /
 * Tutup) -> tombol Scan Layar memicu izin screen-capture sistem (wajib
 * ditanya tiap sesi oleh Android sendiri, tidak bisa dilewati) -> begitu
 * izin diberikan, SATU screenshot otomatis diambil saat itu juga (tanpa
 * input manual lain) -> dibaca pakai OCR on-device -> teksnya dikirim ke
 * backend Nova AI buat diterjemahkan/dijelaskan -> hasil ringkas muncul
 * lewat badge amplop kecil di gelembung.
 */
class BubbleService : Service() {

    private lateinit var windowManager: WindowManager
    private lateinit var bubbleRoot: View
    private lateinit var bubbleIcon: ImageView
    private lateinit var bubbleLoading: ProgressBar
    private lateinit var bubbleBadge: TextView
    private lateinit var actionPanel: LinearLayout
    private lateinit var resultPanel: LinearLayout
    private lateinit var resultText: TextView
    private lateinit var bubbleParams: WindowManager.LayoutParams

    private val serviceScope = CoroutineScope(Dispatchers.Main + SupervisorJob())
    private var lastAnswer: String = ""

    private var mediaProjection: MediaProjection? = null
    private var imageReader: ImageReader? = null
    private var virtualDisplay: android.hardware.display.VirtualDisplay? = null
    private lateinit var captureThread: HandlerThread
    private lateinit var captureHandler: Handler

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onCreate() {
        super.onCreate()
        isRunning = true
        captureThread = HandlerThread("NovaAICapture").apply { start() }
        captureHandler = Handler(captureThread.looper)

        startForegroundWithNotification()
        setupBubbleView()
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        when (intent?.action) {
            ACTION_START_CAPTURE -> {
                val resultCode = intent.getIntExtra(EXTRA_RESULT_CODE, Activity.RESULT_CANCELED)
                val data = intent.getParcelableExtra<Intent>(EXTRA_RESULT_DATA)
                if (resultCode == Activity.RESULT_OK && data != null) {
                    beginSingleScreenshotCapture(resultCode, data)
                } else {
                    setLoading(false)
                }
            }
            ACTION_CAPTURE_DENIED -> {
                setLoading(false)
                Toast.makeText(this, "Izin scan layar ditolak.", Toast.LENGTH_SHORT).show()
            }
        }
        return START_NOT_STICKY
    }

    // ---------- UI gelembung ----------

    private fun setupBubbleView() {
        windowManager = getSystemService(Context.WINDOW_SERVICE) as WindowManager
        val inflater = getSystemService(Context.LAYOUT_INFLATER_SERVICE) as LayoutInflater
        bubbleRoot = inflater.inflate(R.layout.bubble_layout, null)

        bubbleIcon = bubbleRoot.findViewById(R.id.bubbleIcon)
        bubbleLoading = bubbleRoot.findViewById(R.id.bubbleLoading)
        bubbleBadge = bubbleRoot.findViewById(R.id.bubbleBadge)
        actionPanel = bubbleRoot.findViewById(R.id.actionPanel)
        resultPanel = bubbleRoot.findViewById(R.id.resultPanel)
        resultText = bubbleRoot.findViewById(R.id.resultText)

        val overlayType = WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY
        bubbleParams = WindowManager.LayoutParams(
            WindowManager.LayoutParams.WRAP_CONTENT,
            WindowManager.LayoutParams.WRAP_CONTENT,
            overlayType,
            WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE,
            PixelFormat.TRANSLUCENT
        ).apply {
            gravity = Gravity.TOP or Gravity.START
            val prefs = getSharedPreferences(PREFS, Context.MODE_PRIVATE)
            x = prefs.getInt(PREF_X, 0)
            y = prefs.getInt(PREF_Y, 300)
        }

        windowManager.addView(bubbleRoot, bubbleParams)
        attachDragAndTap()

        bubbleRoot.findViewById<View>(R.id.btnScan).setOnClickListener {
            actionPanel.visibility = View.GONE
            requestScreenCapture()
        }
        bubbleRoot.findViewById<View>(R.id.btnCloseBubble).setOnClickListener {
            stopSelf()
        }
        bubbleRoot.findViewById<View>(R.id.btnCloseResult).setOnClickListener {
            resultPanel.visibility = View.GONE
        }
        bubbleBadge.setOnClickListener {
            resultText.text = lastAnswer
            resultPanel.visibility = View.VISIBLE
        }
    }

    private fun attachDragAndTap() {
        var initialX = 0
        var initialY = 0
        var touchStartX = 0f
        var touchStartY = 0f
        var moved = false

        bubbleIcon.setOnTouchListener { _, event ->
            when (event.action) {
                MotionEvent.ACTION_DOWN -> {
                    initialX = bubbleParams.x
                    initialY = bubbleParams.y
                    touchStartX = event.rawX
                    touchStartY = event.rawY
                    moved = false
                    true
                }
                MotionEvent.ACTION_MOVE -> {
                    val dx = (event.rawX - touchStartX).toInt()
                    val dy = (event.rawY - touchStartY).toInt()
                    if (abs(dx) > 8 || abs(dy) > 8) moved = true
                    bubbleParams.x = initialX + dx
                    bubbleParams.y = initialY + dy
                    windowManager.updateViewLayout(bubbleRoot, bubbleParams)
                    true
                }
                MotionEvent.ACTION_UP -> {
                    getSharedPreferences(PREFS, Context.MODE_PRIVATE).edit()
                        .putInt(PREF_X, bubbleParams.x)
                        .putInt(PREF_Y, bubbleParams.y)
                        .apply()
                    if (!moved) {
                        // Tap biasa (bukan drag) -> buka/tutup panel aksi
                        resultPanel.visibility = View.GONE
                        actionPanel.visibility =
                            if (actionPanel.visibility == View.VISIBLE) View.GONE else View.VISIBLE
                    }
                    true
                }
                else -> false
            }
        }
    }

    private fun setLoading(loading: Boolean) {
        bubbleLoading.visibility = if (loading) View.VISIBLE else View.GONE
    }

    // ---------- Minta izin & ambil screenshot otomatis ----------

    private fun requestScreenCapture() {
        setLoading(true)
        val intent = Intent(this, ScreenCaptureActivity::class.java).apply {
            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        }
        startActivity(intent)
    }

    private fun beginSingleScreenshotCapture(resultCode: Int, data: Intent) {
        val projectionManager =
            getSystemService(Context.MEDIA_PROJECTION_SERVICE) as MediaProjectionManager
        val projection = projectionManager.getMediaProjection(resultCode, data)
        mediaProjection = projection

        val metrics = DisplayMetrics()
        windowManager.defaultDisplay.getRealMetrics(metrics)
        val width = metrics.widthPixels
        val height = metrics.heightPixels
        val density = metrics.densityDpi

        val reader = ImageReader.newInstance(width, height, PixelFormat.RGBA_8888, 2)
        imageReader = reader

        reader.setOnImageAvailableListener({ r ->
            val image = r.acquireLatestImage() ?: return@setOnImageAvailableListener
            val bitmap = imageToBitmap(image, width, height)
            image.close()
            stopCaptureResources()
            serviceScope.launch { processBitmap(bitmap) }
        }, captureHandler)

        virtualDisplay = projection.createVirtualDisplay(
            "NovaAIScreenCapture", width, height, density,
            DisplayManager.VIRTUAL_DISPLAY_FLAG_AUTO_MIRROR,
            reader.surface, null, captureHandler
        )
    }

    private fun imageToBitmap(image: Image, width: Int, height: Int): Bitmap {
        val plane = image.planes[0]
        val pixelStride = plane.pixelStride
        val rowStride = plane.rowStride
        val rowPadding = rowStride - pixelStride * width
        val raw = Bitmap.createBitmap(
            width + rowPadding / pixelStride, height, Bitmap.Config.ARGB_8888
        )
        raw.copyPixelsFromBuffer(plane.buffer)
        return Bitmap.createBitmap(raw, 0, 0, width, height)
    }

    private fun stopCaptureResources() {
        virtualDisplay?.release()
        virtualDisplay = null
        imageReader?.close()
        imageReader = null
        mediaProjection?.stop()
        mediaProjection = null
    }

    // ---------- OCR + tanya ke AI ----------

    private suspend fun processBitmap(bitmap: Bitmap) {
        try {
            val recognizer = TextRecognition.getClient(TextRecognizerOptions.DEFAULT_OPTIONS)
            val inputImage = InputImage.fromBitmap(bitmap, 0)
            val visionText = recognizer.process(inputImage).await()
            val scannedText = visionText.text.trim()

            if (scannedText.isEmpty()) {
                lastAnswer = "Tidak ada teks yang terbaca di layar."
                showResult()
                return
            }

            val answer = ApiClient.askAboutScannedText(scannedText)
            lastAnswer = answer
            showResult()
        } catch (e: Exception) {
            lastAnswer = "Terjadi kesalahan: ${e.message}"
            showResult()
        }
    }

    private fun showResult() {
        setLoading(false)
        bubbleBadge.visibility = View.VISIBLE
        resultText.text = lastAnswer
        resultPanel.visibility = View.VISIBLE
    }

    // ---------- Notifikasi foreground (wajib oleh sistem Android) ----------

    private fun startForegroundWithNotification() {
        val channelId = "nova_ai_bubble"
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                channelId, getString(R.string.notif_channel_name),
                NotificationManager.IMPORTANCE_LOW
            )
            (getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager)
                .createNotificationChannel(channel)
        }

        val notification = NotificationCompat.Builder(this, channelId)
            .setContentTitle(getString(R.string.app_name))
            .setContentText(getString(R.string.notif_bubble_active))
            .setSmallIcon(R.mipmap.ic_launcher)
            .setOngoing(true)
            .build()

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            startForeground(
                1, notification, ServiceInfo.FOREGROUND_SERVICE_TYPE_MEDIA_PROJECTION
            )
        } else {
            startForeground(1, notification)
        }
    }

    override fun onDestroy() {
        super.onDestroy()
        isRunning = false
        stopCaptureResources()
        captureThread.quitSafely()
        serviceScope.cancel()
        if (::bubbleRoot.isInitialized) {
            runCatching { windowManager.removeView(bubbleRoot) }
        }
    }

    companion object {
        var isRunning = false
        const val ACTION_START_CAPTURE = "com.novaai.chat.ACTION_START_CAPTURE"
        const val ACTION_CAPTURE_DENIED = "com.novaai.chat.ACTION_CAPTURE_DENIED"
        const val EXTRA_RESULT_CODE = "extra_result_code"
        const val EXTRA_RESULT_DATA = "extra_result_data"
        private const val PREFS = "nova_bubble_prefs"
        private const val PREF_X = "x"
        private const val PREF_Y = "y"
    }
}
