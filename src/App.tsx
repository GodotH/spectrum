import { useQuestionnaire } from './hooks/useQuestionnaire';
import WelcomeScreen from './components/WelcomeScreen';
import QuestionScreen from './components/QuestionScreen';
import ResultsScreen from './components/ResultsScreen';
import HistoryScreen from './components/HistoryScreen';

export default function App() {
  const q = useQuestionnaire();

  return (
    <div className="min-h-screen bg-terminal-bg text-phosphor font-mono">
      {/* CRT effects */}
      <div className="crt-overlay" />
      <div className="crt-vignette" />

      {q.screen === 'welcome' && (
        <WelcomeScreen initialName={q.userName} onStart={q.startTest} onResume={q.resumeTest} onHistory={() => q.setScreen('history')} />
      )}
      {q.screen === 'questionnaire' && (
        <QuestionScreen
          testType={q.testType}
          question={q.currentQuestion}
          currentIndex={q.currentIndex}
          totalQuestions={q.totalQuestions}
          progress={q.progress}
          currentAnswer={q.currentAnswer}
          answerOptions={q.answerOptions}
          answeredCount={q.answers.length}
          answeredIds={new Set(q.answers.map(a => a.questionId))}
          allAnswered={q.allAnswered}
          isLastQuestion={q.isLastQuestion}
          onAnswer={q.answerQuestion}
          onBack={q.goBack}
          onForward={q.goForward}
          onGoToQuestion={q.goToQuestion}
          onFinish={q.finishTest}
          onQuit={q.quitToSelect}
        />
      )}
      {q.screen === 'results' && q.result && (
        <ResultsScreen
          result={q.result}
          onHome={q.goHome}
          onHistory={() => q.setScreen('history')}
          onStartTest={(type) => q.startTest(q.userName, [type])}
          isBattery={q.isBattery}
          hasNextInQueue={q.hasNextInQueue}
          nextTestType={q.nextTestType}
          queueIndex={q.queueIndex}
          queueTotal={q.testQueue.length}
          onAdvanceQueue={q.advanceQueue}
        />
      )}
      {q.screen === 'history' && (
        <HistoryScreen onHome={q.goHome} />
      )}
    </div>
  );
}
