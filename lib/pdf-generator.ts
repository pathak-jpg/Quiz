"use client"

import { jsPDF } from "jspdf"
import "jspdf-autotable"
import type { Quiz, Question, PerformanceAnalysis } from "./types"

declare module "jspdf" {
  interface jsPDF {
    autoTable: (options: any) => jsPDF
  }
}

export function generatePDF(
  studentName: string,
  studentEmail: string,
  quiz: Quiz,
  questions: Question[],
  analysis: PerformanceAnalysis,
): void {
  const doc = new jsPDF()

  // Add title
  doc.setFontSize(20)
  doc.setTextColor(41, 128, 185) // Blue color
  doc.text("Quizlytics - Performance Report", 105, 15, { align: "center" })

  // Add student info
  doc.setFontSize(12)
  doc.setTextColor(0, 0, 0)
  doc.text(`Student: ${studentName}`, 20, 30)
  doc.text(`Email: ${studentEmail}`, 20, 37)

  // Add quiz info
  doc.text(`Quiz: ${quiz.title}`, 20, 47)
  doc.text(`Quiz Code: ${quiz.code}`, 20, 54)
  doc.text(`Difficulty: ${quiz.difficulty.charAt(0).toUpperCase() + quiz.difficulty.slice(1)}`, 20, 61)

  // Add score summary
  doc.setFillColor(240, 240, 240)
  doc.rect(20, 70, 170, 25, "F")
  doc.setFontSize(14)
  doc.text("Performance Summary", 105, 80, { align: "center" })
  doc.setFontSize(12)
  doc.text(`Score: ${analysis.score}/${analysis.maxScore} (${analysis.percentage.toFixed(2)}%)`, 30, 90)
  doc.text(`Time Spent: ${(analysis.timeAnalysis.totalTime / 60).toFixed(2)} minutes`, 120, 90)

  // Add detailed analysis
  doc.setFontSize(14)
  doc.text("Detailed Analysis", 20, 110)

  // Time analysis
  doc.setFontSize(12)
  doc.text("Time Analysis:", 20, 120)
  doc.text(`Average Time per Question: ${analysis.timeAnalysis.averageTimePerQuestion.toFixed(2)} seconds`, 30, 127)

  // Option switching behavior
  doc.text(`Option Switching: ${analysis.optionSwitchCount} times`, 20, 137)

  // Skipped questions
  doc.text(`Skipped Questions: ${analysis.skippedCount}`, 20, 144)

  // Hard questions accuracy
  doc.text(`Hard Questions Accuracy: ${analysis.hardQuestionsAccuracy.toFixed(2)}%`, 20, 151)

  // Efficiency score
  doc.text(`Efficiency Score: ${analysis.efficiencyScore.toFixed(2)} points/minute`, 20, 158)

  // Feedback
  doc.setFontSize(14)
  doc.text("Feedback", 20, 175)

  // Split feedback into multiple lines if needed
  const maxWidth = 170
  const feedback = analysis.feedback
  const feedbackLines = doc.splitTextToSize(feedback, maxWidth)
  doc.setFontSize(12)
  doc.text(feedbackLines, 20, 185)

  // Add question details table
  doc.addPage()
  doc.setFontSize(14)
  doc.text("Question Details", 105, 15, { align: "center" })

  const tableData = questions.map((question, index) => {
    const attempt = analysis.attemptSequence.indexOf(index) !== -1 ? analysis.attemptSequence.indexOf(index) + 1 : "N/A"

    const questionAttempt = analysis.attemptSequence
      .map((seq, i) => {
        if (seq === index) return i
        return -1
      })
      .filter((i) => i !== -1)[0]

    const selectedOption = questionAttempt !== undefined ? String.fromCharCode(65 + questionAttempt) : "None"

    const correctOption = String.fromCharCode(65 + question.correctOptionIndex)
    const isCorrect = selectedOption === correctOption ? "Yes" : "No"

    return [
      index + 1,
      question.text.substring(0, 30) + (question.text.length > 30 ? "..." : ""),
      question.difficulty,
      selectedOption,
      correctOption,
      isCorrect,
      analysis.timeAnalysis.timePerQuestion[index] ? `${analysis.timeAnalysis.timePerQuestion[index]}s` : "N/A",
    ]
  })

  doc.autoTable({
    head: [["#", "Question", "Difficulty", "Selected", "Correct", "Correct?", "Time"]],
    body: tableData,
    startY: 25,
    theme: "grid",
    headStyles: { fillColor: [41, 128, 185] },
  })

  // Save the PDF
  doc.save(`quizlytics_report_${quiz.code}.pdf`)
}

