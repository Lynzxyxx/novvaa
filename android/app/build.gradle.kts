plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
}

android {
    namespace = "com.novaai.chat"
    compileSdk = 34

    defaultConfig {
        applicationId = "com.novaai.chat"
        minSdk = 26
        targetSdk = 34
        versionCode = 1
        versionName = "1.0"

        // URL web app Nova AI (Vercel). GANTI ini ke domain Vercel kamu
        // sendiri -- inilah yang membuat APK ini "tersambung" ke backend
        // Vercel, termasuk semua logic & Environment Variables di sana.
        buildConfigField("String", "WEB_APP_URL", "\"https://novvaa-ai.vercel.app\"")
        buildConfigField("String", "API_BASE_URL", "\"https://novvaa-ai.vercel.app\"")
    }

    buildTypes {
        release {
            isMinifyEnabled = false
            proguardFiles(getDefaultProguardFile("proguard-android-optimize.txt"), "proguard-rules.pro")
        }
    }

    buildFeatures {
        viewBinding = true
        buildConfig = true
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
    kotlinOptions {
        jvmTarget = "17"
    }
}

dependencies {
    implementation("androidx.core:core-ktx:1.13.1")
    implementation("androidx.appcompat:appcompat:1.7.0")
    implementation("com.google.android.material:material:1.12.0")
    implementation("androidx.lifecycle:lifecycle-service:2.8.4")
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-android:1.8.1")
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-play-services:1.8.1")

    // OCR on-device (gratis, tanpa API key, model didownload otomatis sekali oleh Play Services)
    implementation("com.google.android.gms:play-services-mlkit-text-recognition:19.0.1")
}
