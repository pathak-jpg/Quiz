import type { Question, QuestionAttempt, PerformanceAnalysis, TimeAnalysis } from "./types"

export function calculatePerformanceAnalysis(
  questions: Question[],
  questionAttempts: QuestionAttempt[],
  totalTimeSpent: number,
): PerformanceAnalysis {
  // Calculate score
  const score = questionAttempts.reduce((total, attempt, index) => {
    if (attempt.selectedOptionIndex === questions[attempt.questionIndex].correctOptionIndex) {
      return total + 1
    }
    return total
  }, 0)

  const maxScore = questions.length
  const percentage = (score / maxScore) * 100

  // Time analysis
  const timePerQuestion = questionAttempts.map((attempt) => attempt.timeSpent)
  const timeAnalysis: TimeAnalysis = {
    totalTime: totalTimeSpent,
    averageTimePerQuestion: totalTimeSpent / questionAttempts.length,
    timePerQuestion,
  }

  // Option switching behavior
  const optionSwitchCount = questionAttempts.reduce((total, attempt) => total + attempt.optionSwitches, 0)

  // Skipped questions count
  const skippedCount = questionAttempts.filter((attempt) => attempt.skipped).length

  // Hard questions accuracy
  const hardQuestions = questions.filter((q) => q.difficulty === "hard")
  let hardQuestionsAccuracy = 0

  if (hardQuestions.length > 0) {
    const hardQuestionIndices = hardQuestions.map((_, i) => i)
    const correctHardAnswers = questionAttempts.filter(
      (attempt) =>
        hardQuestionIndices.includes(attempt.questionIndex) &&
        attempt.selectedOptionIndex === questions[attempt.questionIndex].correctOptionIndex,
    ).length

    hardQuestionsAccuracy = (correctHardAnswers / hardQuestions.length) * 100
  }

  // Efficiency score
  const efficiencyScore = score / (totalTimeSpent / 60) // Score per minute

  // Attempt sequence
  const attemptSequence = questionAttempts
    .sort((a, b) => a.questionIndex - b.questionIndex)
    .map((attempt) => attempt.questionIndex)

  // Generate feedback
  const feedback = generateFeedback({
    percentage,
    optionSwitchCount,
    skippedCount,
    hardQuestionsAccuracy,
    efficiencyScore,
    timeAnalysis,
  })

  return {
    score,
    maxScore,
    percentage,
    timeAnalysis,
    optionSwitchCount,
    skippedCount,
    hardQuestionsAccuracy,
    efficiencyScore,
    attemptSequence,
    feedback,
  }
}

function generateFeedback(analysis: {
  percentage: number
  optionSwitchCount: number
  skippedCount: number
  hardQuestionsAccuracy: number
  efficiencyScore: number
  timeAnalysis: TimeAnalysis
}): string {
  const { percentage, optionSwitchCount, skippedCount, hardQuestionsAccuracy, efficiencyScore, timeAnalysis } = analysis

  let feedback = ""

  // Overall performance feedback
  if (percentage >= 90) {
    feedback += "Excellent performance! You have a strong understanding of the material. "
  } else if (percentage >= 70) {
    feedback += "Good job! You have a solid grasp of most concepts. "
  } else if (percentage >= 50) {
    feedback += "You're on the right track, but there's room for improvement. "
  } else {
    feedback += "You need to review the material more thoroughly. "
  }

  // Time management feedback
  if (efficiencyScore > 5) {
    feedback += "Your time management is excellent. "
  } else if (efficiencyScore > 3) {
    feedback += "Your time management is good. "
  } else {
    feedback += "Try to improve your time management. "
  }

  // Confidence feedback based on option switching
  if (optionSwitchCount > 10) {
    feedback += "You seem to be second-guessing yourself frequently. Try to be more confident in your answers. "
  } else if (optionSwitchCount > 5) {
    feedback += "You occasionally change your answers. Trust your instincts more. "
  } else {
    feedback += "You show good confidence in your answers. "
  }

  // Skipped questions feedback
  if (skippedCount > 3) {
    feedback += "You skipped several questions. Try to answer all questions, even if you're unsure. "
  } else if (skippedCount > 0) {
    feedback += "You skipped a few questions. Remember that educated guesses are better than no answer. "
  } else {
    feedback += "Great job attempting all questions! "
  }

  // Hard questions feedback
  if (hardQuestionsAccuracy < 30) {
    feedback += "Focus on improving your understanding of more difficult concepts. "
  } else if (hardQuestionsAccuracy < 70) {
    feedback += "You're handling challenging questions reasonably well, but there's room to improve. "
  } else if (hardQuestionsAccuracy > 0) {
    feedback += "You excel at tackling difficult questions. Well done! "
  }

  return feedback
}

