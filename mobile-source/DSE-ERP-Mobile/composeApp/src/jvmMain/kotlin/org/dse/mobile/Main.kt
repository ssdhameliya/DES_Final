package org.dse.mobile

import androidx.compose.ui.unit.dp
import androidx.compose.ui.window.Window
import androidx.compose.ui.window.WindowState
import androidx.compose.ui.window.application
import org.dse.mobile.app.App

fun main() = application {
    Window(
        onCloseRequest = ::exitApplication,
        title = "Jasvi Industries Mobile",
        state = WindowState(width = 430.dp, height = 900.dp),
    ) {
        App()
    }
}
