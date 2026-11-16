plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
}

android {
    namespace = "uz.membrana.hisobchisi"
    compileSdk = 34

    defaultConfig {
        applicationId = "uz.membrana.hisobchisi"
        minSdk = 24
        targetSdk = 34
        versionCode = 7
        versionName = "4.0"
    }

    buildTypes {
        release {
            isMinifyEnabled = false
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
    kotlinOptions {
        jvmTarget = "17"
    }
}
