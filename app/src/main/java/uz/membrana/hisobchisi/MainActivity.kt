package uz.membrana.hisobchisi

import android.annotation.SuppressLint
import android.app.Activity
import android.content.ContentValues
import android.graphics.Color
import android.os.Build
import android.os.Bundle
import android.provider.MediaStore
import android.webkit.JavascriptInterface
import android.webkit.WebChromeClient
import android.webkit.WebView
import android.webkit.WebViewClient
import java.io.File

/**
 * Membrana hisobchisi: butun dastur app/src/main/assets/index.html ichida.
 * O'zgartirish uchun shu fayldagi narxlar, formulalar yoki matnlarni tahrirlang.
 * Eksport (OBJ, CSV) fayllari Yuklashlar papkasiga saqlanadi.
 */
class MainActivity : Activity() {

    private lateinit var web: WebView

    inner class Bridge {
        @JavascriptInterface
        fun saveText(name: String, mime: String, text: String): String {
            return try {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                    val values = ContentValues()
                    values.put(MediaStore.MediaColumns.DISPLAY_NAME, name)
                    values.put(MediaStore.MediaColumns.MIME_TYPE, mime)
                    values.put(MediaStore.MediaColumns.IS_PENDING, 1)
                    val resolver = contentResolver
                    val uri = resolver.insert(MediaStore.Downloads.EXTERNAL_CONTENT_URI, values)
                    if (uri == null) {
                        "ERR"
                    } else {
                        val out = resolver.openOutputStream(uri)
                        if (out == null) {
                            "ERR"
                        } else {
                            out.use { it.write(text.toByteArray(Charsets.UTF_8)) }
                            val done = ContentValues()
                            done.put(MediaStore.MediaColumns.IS_PENDING, 0)
                            resolver.update(uri, done, null, null)
                            "OK:Download/" + name
                        }
                    }
                } else {
                    val dir = getExternalFilesDir(null)
                    if (dir == null) {
                        "ERR"
                    } else {
                        val f = File(dir, name)
                        f.writeText(text, Charsets.UTF_8)
                        "OK:" + f.absolutePath
                    }
                }
            } catch (e: Exception) {
                "ERR"
            }
        }
    }

    @SuppressLint("SetJavaScriptEnabled")
    private var stoppedAt = 0L
    override fun onStop() { super.onStop(); stoppedAt = System.currentTimeMillis() }
    override fun onStart() { super.onStart(); if (stoppedAt == 0L || System.currentTimeMillis() - stoppedAt > 5000) taiyosky.intro.IntroView.show(this, force = true) }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        web = WebView(this)
        web.setBackgroundColor(Color.parseColor("#F3F5F7"))
        web.settings.javaScriptEnabled = true
        web.settings.domStorageEnabled = true   // kiritilgan ma'lumotlar saqlanishi uchun
        web.addJavascriptInterface(Bridge(), "AndroidApp")
        web.webViewClient = WebViewClient()
        web.webChromeClient = WebChromeClient()
        setContentView(web)
        web.loadUrl("file:///android_asset/index.html")
    }

    @Suppress("DEPRECATION")
    override fun onBackPressed() {
        if (web.canGoBack()) web.goBack() else super.onBackPressed()
    }
}
