package uz.membrana.hisobchisi

import android.annotation.SuppressLint
import android.app.Activity
import android.graphics.Color
import android.os.Bundle
import android.webkit.WebChromeClient
import android.webkit.WebView
import android.webkit.WebViewClient

/**
 * Membrana hisobchisi: butun dastur app/src/main/assets/index.html ichida.
 * O'zgartirish uchun shu fayldagi narxlar, formulalar yoki matnlarni tahrirlang.
 */
class MainActivity : Activity() {

    private lateinit var web: WebView

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        web = WebView(this)
        web.setBackgroundColor(Color.parseColor("#F3F5F7"))
        web.settings.javaScriptEnabled = true
        web.settings.domStorageEnabled = true   // kiritilgan ma'lumotlar saqlanishi uchun
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
