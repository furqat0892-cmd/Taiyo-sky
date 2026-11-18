package taiyosky.intro

import android.animation.ValueAnimator
import android.app.Activity
import android.content.Context
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.LinearGradient
import android.graphics.Paint
import android.graphics.Path
import android.graphics.PorterDuff
import android.graphics.PorterDuffXfermode
import android.graphics.RadialGradient
import android.graphics.Shader
import android.graphics.Typeface
import android.media.MediaPlayer
import android.view.MotionEvent
import android.view.View
import android.view.ViewGroup
import android.widget.FrameLayout
import kotlin.math.abs
import kotlin.math.exp
import kotlin.math.max
import kotlin.math.min
import kotlin.math.pow
import kotlin.math.sin
import kotlin.random.Random

/**
 * Taiyo Sky kirish ekrani (v2): ipak nur to'lqinlari bir nuqtaga tortilib chaqnaydi,
 * oltin ip paydo bo'ladi, "TAIYO SKY" yozuvi chiqadi, tovush bilan.
 *
 * Ishlatish (Activity.onCreate ichida, setContentView yoki setContent'dan KEYIN):
 *     taiyosky.intro.IntroView.show(this)
 *
 * Tovush: taiyo_intro.wav faylni res/raw/ papkasiga qo'ying (nomi aynan shunday).
 * Fayl bo'lmasa, kirish ovozsiz ishlaydi. Ekranga tegilsa, o'tkazib yuboriladi.
 */
class IntroView(
    context: Context,
    private val withSound: Boolean,
    private val onFinished: () -> Unit
) : View(context) {

    private class Dust(var x: Float, var y: Float, val s: Float, val v: Float, val p: Float, val z: Boolean)
    private class Bok(var x: Float, var y: Float, val r: Float, val v: Float, val p: Float)

    private val hit = 3.3f
    private val density = resources.displayMetrics.density
    private val add = PorterDuffXfermode(PorterDuff.Mode.ADD)

    private val bgPaint = Paint()
    private val linePaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        style = Paint.Style.STROKE
        strokeWidth = 0.9f * density
        xfermode = add
    }
    private val glowPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply { xfermode = add }
    private val dustPaint = Paint().apply { xfermode = add }
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

    private var start = 0L
    private var last = 0L
    private var finishing = false
    private var player: MediaPlayer? = null

    override fun onAttachedToWindow() {
        super.onAttachedToWindow()
        if (!withSound) return
        try {
            val id = resources.getIdentifier("taiyo_intro", "raw", context.packageName)
            if (id != 0) {
                player = MediaPlayer.create(context, id)?.apply {
                    setOnCompletionListener { release(); player = null }
                    start()
                }
            }
        } catch (e: Exception) {
            player = null
        }
    }

    override fun onDetachedFromWindow() {
        super.onDetachedFromWindow()
        releasePlayer()
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
            bok.add(
                Bok(
                    Random.nextFloat() * fw, Random.nextFloat() * fh,
                    (18f + Random.nextFloat() * 40f) * (fw / 380f),
                    (0.05f + Random.nextFloat() * 0.15f) * 60f * density,
                    Random.nextFloat() * 6.28f
                )
            )
        }
    }

    private fun cl(x: Float) = min(1f, max(0f, x))
    private fun es(a: Float) = a * a * (3f - 2f * a)

    private fun sheet(
        c: Canvas, n: Int, wid: Float, cy0: Float, ph: Float, hue: Float,
        alpha: Float, env: Float, t: Float, pin: Float
    ) {
        val w = width.toFloat()
        val h = height.toFloat()
        val sc = 380f / w
        val steps = 48
        val stepX = w / steps
        val a255 = (min(0.5f, alpha * (1f + 3f * pin)) * 255f).toInt().coerceIn(0, 255)
        for (k in 0..n) {
            val tt = k.toFloat() / n - 0.5f
            path.reset()
            for (i in 0..steps) {
                val x = i * stepX
                val sp = 1f + 0.85f * sin(x / w * 3.3f + t * 0.4f + ph)
                val cy = cy0 + env * (0.09f * h * sin(x * 0.012f * sc + t * 0.7f + ph) +
                        0.052f * h * sin(x * 0.027f * sc - t * 0.5f + ph * 2f))
                val y = cy + tt * wid * env * sp * (1f - 0.8f * pin) +
                        sin(x * 0.02f * sc + t * 0.9f + k * 0.09f + ph) * 0.014f * h * env * tt
                if (i == 0) path.moveTo(x, y) else path.lineTo(x, y)
            }
            hsv[0] = (hue + tt * 30f + 360f) % 360f
            hsv[1] = 0.25f + 0.4f * abs(tt * 2f)
            hsv[2] = 1f
            linePaint.color = Color.HSVToColor(a255, hsv)
            c.drawPath(path, linePaint)
        }
    }

    override fun onDraw(c: Canvas) {
        val w = width.toFloat()
        val h = height.toFloat()
        val now = System.nanoTime()
        if (start == 0L) { start = now; last = now }
        val t = (now - start) / 1e9f
        val dt = ((now - last) / 1e9f).coerceIn(0f, 0.05f)
        last = now
        val s = w / 380f

        c.drawRect(0f, 0f, w, h, bgPaint)

        val fade = cl(t / 1.3f)
        val env = es(cl((t - 0.2f) / 2.8f))
        val pin = if (t < hit) exp(-((t - hit) / 0.45f).pow(2)) else exp(-(t - hit) / 0.7f)

        for (b in bok) {
            b.y -= b.v * dt
            if (b.y < -b.r) b.y = h + b.r
            val a = (0.035f * fade * (0.6f + 0.4f * sin(t * 0.8f + b.p)) * 255f).toInt().coerceIn(0, 255)
            glowPaint.shader = RadialGradient(
                b.x, b.y, b.r, Color.argb(a, 90, 150, 255), Color.argb(0, 90, 150, 255),
                Shader.TileMode.CLAMP
            )
            c.drawCircle(b.x, b.y, b.r, glowPaint)
        }

        sheet(c, 70, 0.357f * h, 0.44f * h, 0f, 205f, 0.075f * fade, env, t, pin)
        sheet(c, 44, 0.262f * h, 0.512f * h, 2.1f, 265f, 0.05f * fade, env, t, pin)
        val ga = es(cl((t - hit) / 1.6f))
        if (ga > 0f) sheet(c, 14, 0.19f * h, 0.476f * h, 4.2f, 42f, 0.12f * ga, env, t, pin * 0.5f)

        glowPaint.shader = RadialGradient(
            w / 2f, h * 0.45f, h * 0.4f,
            Color.argb(((0.12f * env + 0.35f * pin) * 255f).toInt().coerceIn(0, 255), 60, 130, 255),
            Color.argb(0, 60, 130, 255), Shader.TileMode.CLAMP
        )
        c.drawRect(0f, 0f, w, h, glowPaint)

        if (pin > 0.03f) {
            val pa = (0.95f * pin * 255f).toInt().coerceIn(0, 255)
            glowPaint.shader = LinearGradient(
                0f, 0f, w, 0f,
                intArrayOf(Color.argb(0, 170, 210, 255), Color.argb(pa, 215, 235, 255), Color.argb(0, 170, 210, 255)),
                null, Shader.TileMode.CLAMP
            )
            val fy = h * 0.452f
            c.drawRect(0f, fy - 1f * density, w, fy + 1f * density, glowPaint)
            glowPaint.alpha = 100
            c.drawRect(0f, fy - 5f * density, w, fy + 5f * density, glowPaint)
            glowPaint.alpha = 255
        }
        glowPaint.shader = null

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
            val base = Color.argb((0.85f * ta * 255f).toInt(), 215, 230, 255)
            val peak = Color.argb((ta * 255f).toInt(), 255, 250, 235)
            titlePaint.shader = LinearGradient(
                sw - 70f * s, 0f, sw + 70f * s, 0f,
                intArrayOf(base, peak, base), null, Shader.TileMode.CLAMP
            )
            titlePaint.setShadowLayer(16f * density, 0f, 0f, Color.argb((0.7f * ta * 255f).toInt(), 120, 170, 255))
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
        if (skipped) {
            val p = player
            if (p != null) {
                ValueAnimator.ofFloat(1f, 0f).apply {
                    duration = 350
                    addUpdateListener { try { p.setVolume(it.animatedValue as Float, it.animatedValue as Float) } catch (e: Exception) { } }
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
