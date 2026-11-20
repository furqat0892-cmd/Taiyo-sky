package uz.membrana.hisobchisi

import android.annotation.SuppressLint
import android.app.Activity
import android.content.ContentValues
import android.content.ContentValues
import android.content.Intent
import android.provider.MediaStore
import android.util.Base64
import android.graphics.Color
import android.print.PrintAttributes
import android.print.PrintManager
import android.content.Context
import org.json.JSONObject
import java.net.HttpURLConnection
import java.net.URL
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
    private var printWeb: WebView? = null

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

        @JavascriptInterface
        fun saveImage(name: String, base64: String): String {
            return try {
                val bytes = Base64.decode(base64, Base64.DEFAULT)
                val v = ContentValues()
                v.put(MediaStore.Images.Media.DISPLAY_NAME, name)
                v.put(MediaStore.Images.Media.MIME_TYPE, "image/png")
                v.put(MediaStore.Images.Media.RELATIVE_PATH, "Pictures/TaiyoSky")
                val uri = contentResolver.insert(MediaStore.Images.Media.EXTERNAL_CONTENT_URI, v)
                if (uri == null) {
                    "ERR"
                } else {
                    contentResolver.openOutputStream(uri)?.use { o -> o.write(bytes) }
                    "OK:Pictures/TaiyoSky"
                }
            } catch (e: Exception) {
                "ERR"
            }
        }

        @JavascriptInterface
        fun shareText(title: String, text: String) {
            runOnUiThread {
                try {
                    val i = Intent(Intent.ACTION_SEND)
                    i.type = "text/plain"
                    i.putExtra(Intent.EXTRA_SUBJECT, title)
                    i.putExtra(Intent.EXTRA_TEXT, text)
                    startActivity(Intent.createChooser(i, title))
                } catch (e: Exception) {
                }
            }
        }

        @JavascriptInterface
        fun printHtml(title: String, html: String) {
            runOnUiThread {
                try {
                    val w = WebView(this@MainActivity)
                    printWeb = w
                    w.settings.javaScriptEnabled = false
                    w.webViewClient = object : WebViewClient() {
                        override fun onPageFinished(view: WebView, url: String) {
                            val pm = getSystemService(Context.PRINT_SERVICE) as PrintManager
                            val name = if (title.isBlank()) "Hisobot" else title
                            pm.print(name, view.createPrintDocumentAdapter(name), PrintAttributes.Builder().build())
                        }
                    }
                    w.loadDataWithBaseURL(null, html, "text/html", "UTF-8", null)
                } catch (e: Exception) {
                }
            }
        }

        @JavascriptInterface
        fun httpReq(id: Int, method: String, url: String, body: String, headersJson: String) {
            Thread {
                var status = 0
                var out = ""
                try {
                    val c = URL(url).openConnection() as HttpURLConnection
                    c.requestMethod = method
                    c.connectTimeout = 15000
                    c.readTimeout = 60000
                    val h = JSONObject(headersJson)
                    val keys = h.keys()
                    while (keys.hasNext()) {
                        val k = keys.next()
                        c.setRequestProperty(k, h.getString(k))
                    }
                    if (method != "GET" && body.isNotEmpty()) {
                        c.doOutput = true
                        c.outputStream.use { o -> o.write(body.toByteArray(Charsets.UTF_8)) }
                    }
                    status = c.responseCode
                    val st = if (status >= 400) c.errorStream else c.inputStream
                    out = st?.bufferedReader(Charsets.UTF_8)?.use { r -> r.readText() } ?: ""
                } catch (e: Exception) {
                    status = 0
                    out = "{}"
                }
                val js = "window.__mhHttp(" + id + "," + status + "," + JSONObject.quote(out) + ")"
                runOnUiThread { web.evaluateJavascript(js, null) }
            }.start()
        }
    }

    private var stoppedAt = 0L
    override fun onStop() { super.onStop(); stoppedAt = System.currentTimeMillis() }
    override fun onStart() { super.onStart(); if (stoppedAt == 0L || System.currentTimeMillis() - stoppedAt > 5000) taiyosky.intro.IntroView.show(this, force = true) }

    @SuppressLint("SetJavaScriptEnabled")
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
