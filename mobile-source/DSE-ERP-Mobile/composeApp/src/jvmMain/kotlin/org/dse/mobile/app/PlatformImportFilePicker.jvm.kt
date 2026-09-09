package org.dse.mobile.app

import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.apache.poi.ss.usermodel.WorkbookFactory
import org.dse.mobile.core.model.ImportSheet
import java.io.File
import javax.swing.JFileChooser
import javax.swing.filechooser.FileNameExtensionFilter

actual suspend fun pickImportSpreadsheet(): ImportSheet? = withContext(Dispatchers.IO) {
    val chooser = JFileChooser().apply {
        dialogTitle = "Select Jasvi Industries Import File"
        fileFilter = FileNameExtensionFilter("Excel / CSV (*.xlsx, *.xls, *.csv)", "xlsx", "xls", "csv")
    }
    if (chooser.showOpenDialog(null) != JFileChooser.APPROVE_OPTION) return@withContext null
    val file = chooser.selectedFile ?: return@withContext null
    if (file.extension.equals("csv", true)) readCsv(file) else readWorkbook(file)
}

private fun readWorkbook(file:File):ImportSheet {
    WorkbookFactory.create(file).use { wb ->
        val sheet = wb.getSheetAt(0)
        val formatter = org.apache.poi.ss.usermodel.DataFormatter()
        val headerRow = sheet.firstOrNull { row -> row != null && row.any { formatter.formatCellValue(it).isNotBlank() } }
            ?: return ImportSheet(file.name, sheet.sheetName)
        val headers = (0 until headerRow.lastCellNum.toInt().coerceAtLeast(0)).map { idx -> normalizeHeader(cellText(headerRow.getCell(idx), formatter)) }
        val rows = mutableListOf<Map<String,String>>()
        for (r in (headerRow.rowNum + 1)..sheet.lastRowNum) {
            val row = sheet.getRow(r) ?: continue
            val values = linkedMapOf<String,String>()
            headers.forEachIndexed { idx,h -> if(h.isNotBlank()) values[h] = cellText(row.getCell(idx), formatter).trim() }
            if(values.values.any { it.isNotBlank() }) rows += values
        }
        return ImportSheet(file.name, sheet.sheetName, headers.filter{it.isNotBlank()}, rows)
    }
}

private fun readCsv(file: File): ImportSheet {
    val raw = file.readText()
    val records = parseCsvRecords(raw).filter { row -> row.any { it.isNotBlank() } }
    if (records.isEmpty()) return ImportSheet(file.name, rawCsv = raw, platformNotice = "The selected CSV is empty.")
    val headers = records.first().map(::normalizeHeader)
    val rows = records.drop(1).mapNotNull { cells ->
        val values = linkedMapOf<String, String>()
        headers.forEachIndexed { index, header -> if (header.isNotBlank()) values[header] = cells.getOrElse(index) { "" }.trim() }
        values.takeIf { it.values.any(String::isNotBlank) }
    }
    return ImportSheet(file.name, "CSV", headers.filter(String::isNotBlank), rows, raw)
}

private fun parseCsvRecords(text: String): List<List<String>> {
    val records = mutableListOf<List<String>>()
    var row = mutableListOf<String>()
    val cell = StringBuilder()
    var quoted = false
    var i = 0
    fun finishCell() { row.add(cell.toString()); cell.setLength(0) }
    fun finishRow() { finishCell(); records.add(row); row = mutableListOf() }
    while (i < text.length) {
        val ch = text[i]
        when {
            ch == '"' && quoted && i + 1 < text.length && text[i + 1] == '"' -> { cell.append('"'); i++ }
            ch == '"' -> quoted = !quoted
            ch == ',' && !quoted -> finishCell()
            (ch == '\n' || ch == '\r') && !quoted -> {
                if (ch == '\r' && i + 1 < text.length && text[i + 1] == '\n') i++
                finishRow()
            }
            else -> cell.append(ch)
        }
        i++
    }
    if (cell.isNotEmpty() || row.isNotEmpty()) finishRow()
    return records
}

private fun cellText(cell:org.apache.poi.ss.usermodel.Cell?, formatter:org.apache.poi.ss.usermodel.DataFormatter):String {
    if (cell == null) return ""
    return try {
        if (cell.cellType == org.apache.poi.ss.usermodel.CellType.NUMERIC && org.apache.poi.ss.usermodel.DateUtil.isCellDateFormatted(cell)) {
            cell.localDateTimeCellValue.toLocalDate().toString()
        } else formatter.formatCellValue(cell)
    } catch (_:Exception) { formatter.formatCellValue(cell) }
}

private fun normalizeHeader(v:String)=v.trim().lowercase().replace(Regex("[^a-z0-9]+"),"_").trim('_')
