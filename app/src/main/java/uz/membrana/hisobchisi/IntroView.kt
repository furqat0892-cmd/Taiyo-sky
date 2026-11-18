package taiyosky.intro

import android.animation.ValueAnimator
import android.app.Activity
import android.content.Context
import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.LinearGradient
import android.graphics.Matrix
import android.graphics.Paint
import android.graphics.Path
import android.graphics.RadialGradient
import android.graphics.Rect
import android.graphics.Shader
import android.graphics.Typeface
import android.media.MediaPlayer
import android.view.MotionEvent
import android.view.View
import android.view.ViewGroup
import android.webkit.WebView
import android.widget.FrameLayout
import kotlin.math.abs
import kotlin.math.exp
import kotlin.math.max
import kotlin.math.min
import kotlin.math.pow
import kotlin.math.sin
import kotlin.random.Random

/**
 * Taiyo Sky kirish ekrani (v3, yengil): ipak to'lqinlar kichik rasmga chizilib kattalashtiriladi,
 * barcha gradientlar bir marta yaratiladi, tovush fonda tayyorlanadi, kirish paytida
 * asosiy sahifa (WebView) to'xtatib turiladi va kirish tugashi bilan davom ettiriladi.
 *
 * Ishlatish avvalgidek: taiyosky.intro.IntroView.show(this, force = true)
 * Tovush: res/raw/taiyo_intro.wav (bo'lmasa ovozsiz ishlaydi). Tegilsa, o'tkazib yuboriladi.
 */
class IntroView(
    context: Context,
    private val withSound: Boolean,
    private val onFinished: () -> Unit
) : View(context) {

    private class Dust(var x: Float, var y: Float, val s: Float, val v: Float, val p: Float, val z: Boolean)
    private class Bok(var x: Float, var y: Float, val r: Float, val v: Float, val p: Float) {
        var shader: Shader? = null
    }

    private val hit = 3.3f
    private val density = resources.displayMetrics.density
    private val lowScale = 0.4f

    private val bgPaint = Paint()
    private val wavePaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        style = Paint.Style.STROKE
        strokeWidth = max(1f, 0.9f * density * lowScale)
    }
    private val bmpPaint = Paint(Paint.FILTER_BITMAP_FLAG)
    private val glowPaint = Paint()
    private val bokPaint = Paint(Paint.ANTI_ALIAS_FLAG)
    private val flashPaint = Paint()
    private val dustPaint = Paint()
    private val vignettePaint = Paint()
    private val titlePaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        textAlign = Paint.Align.CENTER
        typeface = Typeface.create("sans-serif-light", Typeface.NORMAL)
    }
    private val subPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        textAlign = Paint.Align.CENTER
        typeface = Typeface.create("sans-serif", Typeface.NORMAL)
        color = Color.argb(255, 170, 195, 235)
    }
    private val rulePaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        style = Paint.Style.STROKE
        strokeWidth = 0.9f * density
    }

    private val path = Path()
    private val hsv = FloatArray(3)
    private val dust = ArrayList<Dust>()
    private val bok = ArrayList<Bok>()
    private val dst = Rect()
    private val titleMatrix = Matrix()

    private var bmp: Bitmap? = null
    private var bmpCanvas: Canvas? = null
    private var glowShader: Shader? = null
    private var flashShader: Shader? = null
    private var titleShader: LinearGradient? = null

    private var start = 0L
    private var last = 0L
    private var ready = false
    private var finishing = false
    private var player: MediaPlayer? = null
    private var web: WebView? = null

    private fun findWeb(v: View): WebView? {
        if (v is WebView) return v
        if (v is ViewGroup) {
            for (i in 0 until v.childCount) {
                val r = findWeb(v.getChildAt(i))
                if (r != null) return r
            }
        }
        return null
    }

    private fun pauseWeb() {
        try {
            val root = (context as? Activity)?.findViewById<View>(android.R.id.content)
            val wv = if (root != null) findWeb(root) else null
            if (wv != null) {
                wv.onPause()
                wv.pauseTimers()
                web = wv
            }
        } catch (e: Exception) {
            web = null
        }
    }

    private fun resumeWeb() {
        val wv = web ?: return
        web = null
        try {
            wv.onResume()
            wv.resumeTimers()
        } catch (e: Exception) {
        }
    }

    override fun onAttachedToWindow() {
        super.onAttachedToWindow()
        pauseWeb()
        var waitSound = false
        if (withSound) {
            try {
                val id = resources.getIdentifier("taiyo_intro", "raw", context.packageName)
                if (id != 0) {
                    val afd = resources.openRawResourceFd(id)
                    val mp = MediaPlayer()
                    mp.setDataSource(afd.fileDescriptor, afd.startOffset, afd.length)
                    afd.close()
                    mp.setOnPreparedListener {
                        try { it.start() } catch (e: Exception) { }
                        ready = true
                        invalidate()
                    }
                    mp.setOnCompletionListener {
                        try { it.release() } catch (e: Exception) { }
                        if (player === it) player = null
                    }
                    mp.prepareAsync()
                    player = mp
                    waitSound = true
                }
            } catch (e: Exception) {
                releasePlayer()
                waitSound = false
            }
        }
        if (waitSound) postDelayed({ ready = true; invalidate() }, 500) else ready = true
        invalidate()
    }

    override fun onDetachedFromWindow() {
        super.onDetachedFromWindow()
        resumeWeb()
        releasePlayer()
        bmp?.recycle()
        bmp = null
        bmpCanvas = null
    }

    private fun releasePlayer() {
        try { player?.release() } catch (e: Exception) { }
        player = null
    }

    override fun onSizeChanged(w: Int, h: Int, oldw: Int, oldh: Int) {
        val fw = w.toFloat()
        val fh = h.toFloat()
        bgPaint.shader = LinearGradient(
            0f, 0f, 0f, fh,
            intArrayOf(0xFF01030A.toInt(), 0xFF06122C.toInt(), 0xFF01030A.toInt()),
            floatArrayOf(0f, 0.5f, 1f), Shader.TileMode.CLAMP
        )
        vignettePaint.shader = RadialGradient(
            fw / 2f, fh * 0.45f, max(fw, fh) * 0.75f,
            intArrayOf(Color.argb(0, 0, 0, 0), Color.argb(200, 0, 0, 0)),
            floatArrayOf(0.25f, 1f), Shader.TileMode.CLAMP
        )
        glowShader = RadialGradient(
            fw / 2f, fh * 0.45f, fh * 0.4f,
            Color.argb(255, 60, 130, 255), Color.argb(0, 60, 130, 255), Shader.TileMode.CLAMP
        )
        flashShader = LinearGradient(
            0f, 0f, fw, 0f,
            intArrayOf(Color.argb(0, 170, 210, 255), Color.argb(255, 215, 235, 255), Color.argb(0, 170, 210, 255)),
            null, Shader.TileMode.CLAMP
        )
        val s = fw / 380f
        titleShader = LinearGradient(
            -70f * s, 0f, 70f * s, 0f,
            intArrayOf(Color.argb(217, 215, 230, 255), Color.argb(255, 255, 250, 235), Color.argb(217, 215, 230, 255)),
            null, Shader.TileMode.CLAMP
        )
        bmp?.recycle()
        val bw = max(1, (fw * lowScale).toInt())
        val bh = max(1, (fh * lowScale).toInt())
        val b = Bitmap.createBitmap(bw, bh, Bitmap.Config.ARGB_8888)
        bmp = b
        bmpCanvas = Canvas(b)
        dst.set(0, 0, w, h)

        dust.clear()
        repeat(170) {
            dust.add(
                Dust(
                    Random.nextFloat() * fw, Random.nextFloat() * fh,
                    (0.6f + Random.nextFloat() * 1.5f) * density,
                    (0.1f + Random.nextFloat() * 0.35f) * 60f * density,
                    Random.nextFloat() * 6.28f,
                    Random.nextFloat() < 0.2f
                )
            )
        }
        bok.clear()
        repeat(12) {
            val r = (18f + Random.nextFloat() * 40f) * (fw / 380f)
            val bk = Bok(
                Random.nextFloat() * fw, Random.nextFloat() * fh, r,
                (0.05f + Random.nextFloat() * 0.15f) * 60f * density,
                Random.nextFloat() * 6.28f
            )
            bk.shader = RadialGradient(
                0f, 0f, r, Color.argb(255, 90, 150, 255), Color.argb(0, 90, 150, 255),
                Shader.TileMode.CLAMP
            )
            bok.add(bk)
        }
    }

    private fun cl(x: Float) = min(1f, max(0f, x))
    private fun es(a: Float) = a * a * (3f - 2f * a)

    private fun sheet(
        c: Canvas, bw: Float, bh: Float, n: Int, wid: Float, cy0: Float, ph: Float, hue: Float,
        alpha: Float, env: Float, t: Float, pin: Float
    ) {
        val sc = 380f / bw
        val steps = 40
        val stepX = bw / steps
        val a255 = (min(0.8f, alpha * (1f + 3f * pin)) * 255f).toInt().coerceIn(0, 255)
        for (k in 0..n) {
            val tt = k.toFloat() / n - 0.5f
            path.reset()
            for (i in 0..steps) {
                val x = i * stepX
                val sp = 1f + 0.85f * sin(x / bw * 3.3f + t * 0.4f + ph)
                val cy = cy0 + env * (0.09f * bh * sin(x * 0.012f * sc + t * 0.7f + ph) +
                        0.052f * bh * sin(x * 0.027f * sc - t * 0.5f + ph * 2f))
                val y = cy + tt * wid * env * sp * (1f - 0.8f * pin) +
                        sin(x * 0.02f * sc + t * 0.9f + k * 0.09f + ph) * 0.014f * bh * env * tt
                if (i == 0) path.moveTo(x, y) else path.lineTo(x, y)
            }
            hsv[0] = (hue + tt * 30f + 360f) % 360f
            hsv[1] = 0.25f + 0.4f * abs(tt * 2f)
            hsv[2] = 1f
            wavePaint.color = Color.HSVToColor(a255, hsv)
            c.drawPath(path, wavePaint)
        }
    }

    override fun onDraw(c: Canvas) {
        val w = width.toFloat()
        val h = height.toFloat()
        c.drawRect(0f, 0f, w, h, bgPaint)
        if (!ready) {
            postInvalidateOnAnimation()
            return
        }
        val now = System.nanoTime()
        if (start == 0L) { start = now; last = now }
        val t = (now - start) / 1e9f
        val dt = ((now - last) / 1e9f).coerceIn(0f, 0.05f)
        last = now
        val s = w / 380f

        val fade = cl(t / 1.3f)
        val env = es(cl((t - 0.2f) / 2.8f))
        val pin = if (t < hit) exp(-((t - hit) / 0.45f).pow(2)) else exp(-(t - hit) / 0.7f)

        for (b in bok) {
            b.y -= b.v * dt
            if (b.y < -b.r) b.y = h + b.r
            val a = (0.035f * fade * (0.6f + 0.4f * sin(t * 0.8f + b.p)) * 255f).toInt().coerceIn(0, 255)
            bokPaint.shader = b.shader
            bokPaint.alpha = a
            c.save()
            c.translate(b.x, b.y)
            c.drawCircle(0f, 0f, b.r, bokPaint)
            c.restore()
        }

        val bc = bmpCanvas
        val bm = bmp
        if (bc != null && bm != null) {
            bm.eraseColor(Color.TRANSPARENT)
            val bw = bm.width.toFloat()
            val bh = bm.height.toFloat()
            sheet(bc, bw, bh, 70, 0.357f * bh, 0.44f * bh, 0f, 205f, 0.12f * fade, env, t, pin)
            sheet(bc, bw, bh, 44, 0.262f * bh, 0.512f * bh, 2.1f, 265f, 0.08f * fade, env, t, pin)
            val ga = es(cl((t - hit) / 1.6f))
            if (ga > 0f) sheet(bc, bw, bh, 14, 0.19f * bh, 0.476f * bh, 4.2f, 42f, 0.19f * ga, env, t, pin * 0.5f)
            c.drawBitmap(bm, null, dst, bmpPaint)
        }

        glowPaint.shader = glowShader
        glowPaint.alpha = ((0.12f * env + 0.35f * pin) * 255f).toInt().coerceIn(0, 255)
        c.drawRect(0f, 0f, w, h, glowPaint)

        if (pin > 0.03f) {
            val pa = (0.95f * pin * 255f).toInt().coerceIn(0, 255)
            flashPaint.shader = flashShader
            val fy = h * 0.452f
            flashPaint.alpha = pa
            c.drawRect(0f, fy - 1f * density, w, fy + 1f * density, flashPaint)
            flashPaint.alpha = (pa * 0.4f).toInt()
            c.drawRect(0f, fy - 5f * density, w, fy + 5f * density, flashPaint)
        }

        for (d in dust) {
            d.y -= d.v * dt * (if (d.z) 1.8f else 1f)
            d.x += sin(t * 0.5f + d.p) * 6f * dt * density
            if (d.y < -4f) { d.y = h + 4f; d.x = Random.nextFloat() * w }
            val tw = sin(t * 1.7f + d.p)
            val a = ((0.25f + 0.5f * tw * tw) * fade * 255f).toInt().coerceIn(0, 255)
            dustPaint.color = Color.argb(a, 190, 220, 255)
            val sz = if (d.z) d.s * 1.6f else d.s
            c.drawRect(d.x, d.y, d.x + sz, d.y + sz, dustPaint)
        }

        c.drawRect(0f, 0f, w, h, vignettePaint)

        val ta = es(cl((t - hit + 0.2f) / 2f))
        if (ta > 0f) {
            val titleSize = w * 0.074f
            titlePaint.textSize = titleSize
            val lsPx = (18f - 11f * es(cl((t - hit) / 2.8f))) * s
            titlePaint.letterSpacing = lsPx / titleSize
            val sw = (-80f + (t - hit - 0.8f) / 2.2f * (380f + 160f)) * s
            titleMatrix.setTranslate(sw, 0f)
            titleShader?.setLocalMatrix(titleMatrix)
            titlePaint.shader = titleShader
            titlePaint.alpha = (ta * 255f).toInt().coerceIn(0, 255)
            c.drawText("TAIYO SKY", w / 2f + lsPx / 2f, h * 0.857f, titlePaint)

            val lw = 70f * s * es(cl((t - hit - 0.8f) / 1.5f))
            rulePaint.color = Color.argb((0.7f * ta * 255f).toInt(), 235, 190, 110)
            c.drawLine(w / 2f - lw, h * 0.905f, w / 2f + lw, h * 0.905f, rulePaint)

            subPaint.textSize = w * 0.029f
            subPaint.letterSpacing = 0.18f
            subPaint.alpha = (0.75f * es(cl((t - hit - 1.6f) / 1.2f)) * 255f).toInt().coerceIn(0, 255)
            c.drawText("MEMBRANE CALCULATOR", w / 2f, h * 0.948f, subPaint)
        }

        if (t > 7.2f && !finishing) finish(false)
        postInvalidateOnAnimation()
    }

    private fun finish(skipped: Boolean) {
        if (finishing) return
        finishing = true
        resumeWeb()
        if (skipped) {
            val p = player
            if (p != null) {
                ValueAnimator.ofFloat(1f, 0f).apply {
                    duration = 350
                    addUpdateListener {
                        try {
                            val v = it.animatedValue as Float
                            p.setVolume(v, v)
                        } catch (e: Exception) { }
                    }
                    start()
                }
            }
        }
        animate().alpha(0f).setDuration(if (skipped) 350 else 700).withEndAction {
            if (skipped) releasePlayer()
            onFinished()
        }.start()
    }

    override fun onTouchEvent(event: MotionEvent): Boolean {
        if (event.action == MotionEvent.ACTION_DOWN) finish(true)
        return true
    }

    companion object {
        private var shown = false

        fun show(activity: Activity, withSound: Boolean = true, force: Boolean = false) {
            if (shown && !force) return
            shown = true
            lateinit var view: IntroView
            view = IntroView(activity, withSound) { (view.parent as? ViewGroup)?.removeView(view) }
            activity.addContentView(
                view,
                FrameLayout.LayoutParams(
                    ViewGroup.LayoutParams.MATCH_PARENT,
                    ViewGroup.LayoutParams.MATCH_PARENT
                )
            )
        }
    }
}
