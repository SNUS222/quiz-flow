import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Plus, Users, Trophy, CheckCircle2, LogOut, ArrowLeft, Loader2, Mail, Lock, Trash2, Clock } from 'lucide-react';

// --- КОНФИГУРАЦИЯ SUPABASE ---
const supabaseUrl = 'https://ezlvsovcakjdhitiuftl.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV6bHZzb3ZjYWtqZGhpdGl1ZnRsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE0MzMxOTIsImV4cCI6MjA4NzAwOTE5Mn0.w2-PKjPcoIjOyI39LQorD5yWbEId2NBBGS6n3i3EV_w'; 

// Глобальный клиент БД
let supabase = null;

// --- УТИЛИТЫ ---
const generateGameCode = () => Math.floor(100000 + Math.random() * 900000).toString();

const cardColors = [
  'bg-rose-500 hover:bg-rose-600',
  'bg-blue-500 hover:bg-blue-600',
  'bg-amber-500 hover:bg-amber-600',
  'bg-emerald-500 hover:bg-emerald-600'
];

const barColors = [
  'from-cyan-400 to-cyan-500',
  'from-blue-400 to-blue-500',
  'from-indigo-600 to-blue-800',
  'from-indigo-400 to-indigo-500',
  'from-slate-500 to-slate-600'
];

// --- ХУКИ РЕАЛЬНОГО ВРЕМЕНИ ---
const useTableSync = (tableName, filterCol, filterVal) => {
  const [data, setData] = useState([]);
  
  const fetchData = async () => {
    if (!supabase) return;
    let query = supabase.from(tableName).select('*');
    if (filterCol && filterVal) query = query.eq(filterCol, filterVal);
    const { data: initData } = await query;
    if (initData) setData(initData);
  };

  useEffect(() => {
    fetchData();
    if (!supabase) return;

    const channel = supabase.channel(`public:${tableName}:${filterVal || 'all'}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: tableName }, payload => {
        fetchData(); 
      }).subscribe();

    const interval = setInterval(fetchData, 15000);

    return () => { 
      supabase.removeChannel(channel); 
      clearInterval(interval);
    };
  }, [tableName, filterCol, filterVal]);

  return [data, fetchData];
};

const useDocSync = (tableName, id) => {
  const [doc, setDoc] = useState(null);
  
  const fetchDoc = async () => {
    if (!id || !supabase) return;
    const { data } = await supabase.from(tableName).select('*').eq('id', id).single();
    if (data) setDoc(data);
  };

  useEffect(() => {
    fetchDoc();
    if (!id || !supabase) return;

    const channel = supabase.channel(`public:${tableName}:${id}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: tableName, filter: `id=eq.${id}` }, payload => {
        setDoc(payload.new); 
      }).subscribe();

    const interval = setInterval(fetchDoc, 15000);

    return () => { 
      supabase.removeChannel(channel); 
      clearInterval(interval);
    };
  }, [tableName, id]);

  return [doc, fetchDoc];
};

// --- ОПТИМИЗИРОВАННЫЙ ФОН ---
const particlesConfig = Array.from({ length: 30 }).map((_, i) => {
  const symbols = ['∑', 'π', 'E=mc²', '∫', '∞', 'Ω', 'Δ', 'θ', 'λ', 'μ', 'H₂O', 'O₂', '√', '≈', '≠', '∈', 'α', 'β'];
  return {
    id: i, 
    symbol: symbols[Math.floor(Math.random() * symbols.length)], 
    left: `${Math.random() * 100}vw`, 
    duration: 20 + Math.random() * 30, 
    delay: -(Math.random() * 40), 
    size: 14 + Math.random() * 24, 
    opacity: 0.03 + Math.random() * 0.1 
  };
});

const Background = React.memo(() => (
  <div className="fixed inset-0 z-0 bg-slate-950 overflow-hidden pointer-events-none">
    <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-900/30 blur-[120px] mix-blend-screen" />
    <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-violet-900/30 blur-[120px] mix-blend-screen" />
    <div className="absolute top-[20%] right-[20%] w-[30%] h-[30%] rounded-full bg-fuchsia-900/20 blur-[100px] mix-blend-screen" />
    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.03]" />
    {particlesConfig.map((p) => (
      <motion.div key={p.id} initial={{ y: '-10vh', x: p.left, rotate: 0 }} animate={{ y: '110vh', rotate: 360 }} transition={{ duration: p.duration, repeat: Infinity, ease: "linear", delay: p.delay }} style={{ position: 'absolute', fontSize: `${p.size}px`, color: '#ffffff', opacity: p.opacity, fontWeight: 'bold' }}>
        {p.symbol}
      </motion.div>
    ))}
  </div>
));

// --- UI КОМПОНЕНТЫ ---
const PageTransition = ({ children, className = "" }) => (
  <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} transition={{ duration: 0.3, ease: "easeOut" }} className={`w-full max-w-4xl mx-auto ${className}`}>
    {children}
  </motion.div>
);

const Card = ({ children, className = "" }) => (
  <div className={`bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-5 md:p-8 shadow-2xl ${className}`}>
    {children}
  </div>
);

const Button = ({ children, onClick, variant = 'primary', className = "", disabled = false }) => {
  const base = "relative overflow-hidden font-semibold rounded-2xl py-3 px-6 transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed";
  const variants = {
    primary: "bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white shadow-lg shadow-indigo-500/25",
    secondary: "bg-white/10 hover:bg-white/20 text-white border border-white/10",
    danger: "bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 border border-rose-500/30",
    success: "bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 border border-emerald-500/30",
  };
  return (
    <motion.button whileHover={!disabled ? { scale: 1.02 } : {}} whileTap={!disabled ? { scale: 0.98 } : {}} onClick={onClick} disabled={disabled} className={`${base} ${variants[variant]} ${className}`}>
      {children}
    </motion.button>
  );
};

const Input = ({ value, onChange, placeholder, type = "text", className = "", maxLength }) => (
  <input type={type} value={value} onChange={onChange} placeholder={placeholder} maxLength={maxLength}
    className={`w-full bg-black/20 border border-white/10 rounded-2xl py-4 px-6 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all ${className}`}
  />
);

const Leaderboard = ({ players, currentPlayerId = null }) => {
  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);
  const maxScore = Math.max(...sortedPlayers.map(p => p.score), 1);

  return (
    <div className="w-full space-y-5 md:space-y-6 mt-6">
      <AnimatePresence>
        {sortedPlayers.map((p, i) => {
          const isMe = p.id === currentPlayerId;
          const width = Math.max((p.score / maxScore) * 100, 15);
          const colorClass = barColors[i % barColors.length];

          return (
            <motion.div key={p.id} layout initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} className="relative w-full group">
              <div className="flex items-center mb-1 px-2 justify-between">
                <span className="text-xs md:text-sm font-bold text-gray-400 uppercase tracking-wider">Место #{i + 1}</span>
                {isMe && <span className="text-[10px] md:text-xs bg-violet-500 text-white px-2 py-0.5 rounded-full animate-pulse">ЭТО ВЫ</span>}
              </div>
              
              <div className="relative h-12 md:h-14 w-full bg-black/20 rounded-full border border-white/5 overflow-hidden shadow-inner flex items-center">
                <motion.div initial={{ width: 0 }} animate={{ width: `${width}%` }} transition={{ duration: 1, ease: "easeOut" }} className={`absolute left-0 top-0 bottom-0 bg-gradient-to-r ${colorClass} rounded-full shadow-[0_4px_15px_rgba(0,0,0,0.3)] border-r border-white/20`} />
                <div className="relative z-10 w-full flex justify-between items-center px-4 md:px-6">
                  <span className="font-extrabold text-white text-sm md:text-lg drop-shadow-md truncate max-w-[50%] md:max-w-[60%]">{p.nickname}</span>
                  <div className="flex items-center gap-1 md:gap-2 shrink-0">
                    <span className="text-base md:text-xl font-black text-white drop-shadow-md">{p.score}</span>
                    <span className="text-[9px] md:text-xs font-bold text-white/70 uppercase pt-1">баллов</span>
                  </div>
                </div>
              </div>
              <div className="absolute -bottom-1 left-4 right-4 h-2 bg-black/20 blur-sm rounded-full -z-10" />
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};

// --- СТРАНИЦЫ ПРИЛОЖЕНИЯ ---

const Home = ({ navigate, isCreator }) => (
  <PageTransition className="text-center mt-20">
    <h1 className="text-5xl md:text-7xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white via-indigo-200 to-white mb-6 tracking-tight">
      QuizFlow
    </h1>
    <p className="text-lg md:text-xl text-gray-400 mb-12 max-w-2xl mx-auto">
      Создавайте интерактивные тесты, соревнуйтесь с друзьями в реальном времени и получайте удовольствие от процесса обучения.
    </p>
    <div className="flex flex-col md:flex-row items-center justify-center gap-6">
      <Button onClick={() => navigate('join')} className="w-full md:w-auto text-lg py-4 px-10"><Play className="w-5 h-5" /> Участвовать</Button>
      <Button onClick={() => navigate(isCreator ? 'dashboard' : 'auth')} variant="secondary" className="w-full md:w-auto text-lg py-4 px-10">Создать игру</Button>
    </div>
  </PageTransition>
);

const AuthScreen = ({ navigate }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) return setError("Заполните все поля");
    setError(''); setLoading(true);
    try {
      let result = isLogin ? await supabase.auth.signInWithPassword({ email, password }) : await supabase.auth.signUp({ email, password });
      if (result.error) throw result.error;
      navigate('dashboard');
    } catch (err) { setError(err.message || "Ошибка авторизации."); } finally { setLoading(false); }
  };

  return (
    <PageTransition className="flex items-center justify-center min-h-[60vh]">
      <Card className="w-full max-w-md">
        <h2 className="text-3xl font-bold text-center text-white mb-8">{isLogin ? 'Вход для создателей' : 'Регистрация'}</h2>
        {error && <div className="bg-rose-500/20 border border-rose-500 text-rose-200 p-3 rounded-xl mb-6 text-center text-sm">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4 mb-8">
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input value={email} onChange={e => setEmail(e.target.value)} placeholder="Ваш Email" type="email" className="pl-12" />
          </div>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input value={password} onChange={e => setPassword(e.target.value)} placeholder="Пароль" type="password" className="pl-12" />
          </div>
          <Button onClick={handleSubmit} className="w-full py-4 text-lg" disabled={loading}>
            {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : (isLogin ? 'Войти' : 'Создать аккаунт')}
          </Button>
        </form>
        <div className="text-center text-gray-400">
          {isLogin ? 'Нет аккаунта? ' : 'Уже есть аккаунт? '}
          <button type="button" onClick={() => setIsLogin(!isLogin)} className="text-violet-400 hover:text-violet-300 font-medium transition-colors">
            {isLogin ? 'Зарегистрироваться' : 'Войти'}
          </button>
        </div>
      </Card>
    </PageTransition>
  );
};

const Dashboard = ({ user, navigate }) => {
  const [deletingId, setDeletingId] = useState(null);
  const [tests, refetchTests] = useTableSync('tests', 'creatorId', user?.id);
  
  const handleDelete = async (testId) => {
    try { 
      await supabase.from('tests').delete().eq('id', testId); 
      setDeletingId(null); 
      refetchTests(); 
    } 
    catch (e) { console.error("Ошибка при удалении", e); }
  };

  return (
    <PageTransition>
      <div className="flex justify-between items-center mb-10">
        <div>
          <h2 className="text-3xl font-bold text-white mb-2">Ваши тесты</h2>
          <p className="text-gray-400">Управляйте своими играми</p>
        </div>
        <Button onClick={() => navigate('create-test')}><Plus className="w-5 h-5" /> Создать</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {tests.sort((a, b) => b.createdAt - a.createdAt).map(test => (
          <Card key={test.id} className="group hover:bg-white/10 transition-colors cursor-pointer relative overflow-hidden">
            <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
              <Trophy className="w-24 h-24 text-white" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2 relative z-10">{test.title}</h3>
            <p className="text-gray-400 mb-6 relative z-10">
              {test.questionsPerPlayer && test.questionsPerPlayer !== test.questions?.length 
                ? `${test.questionsPerPlayer} из ${test.questions?.length || 0} вопросов на игру` 
                : `${test.questions?.length || 0} вопросов`}
            </p>
            
            {deletingId === test.id ? (
              <div className="flex gap-2 relative z-10">
                <Button variant="danger" onClick={() => handleDelete(test.id)} className="flex-1">Точно удалить?</Button>
                <Button variant="secondary" onClick={() => setDeletingId(null)}>Отмена</Button>
              </div>
            ) : (
              <div className="flex gap-3 relative z-10">
                <Button onClick={() => navigate('host', { testId: test.id })} className="flex-1">Запустить игру</Button>
                <Button variant="secondary" onClick={() => setDeletingId(test.id)} className="px-4">
                  <Trash2 className="w-5 h-5 text-rose-400" />
                </Button>
              </div>
            )}
          </Card>
        ))}
        {tests.length === 0 && (
          <div className="col-span-full text-center py-20 border-2 border-dashed border-white/10 rounded-3xl">
            <p className="text-gray-400 text-lg">У вас пока нет тестов.</p>
            <Button variant="secondary" onClick={() => navigate('create-test')} className="mt-4 mx-auto">Создать первый тест</Button>
          </div>
        )}
      </div>
    </PageTransition>
  );
};

const CreateTest = ({ user, navigate }) => {
  const [title, setTitle] = useState('');
  const [questions, setQuestions] = useState([{ text: '', options: ['', '', '', ''], correctIndex: 0 }]);
  const [questionsPerPlayer, setQuestionsPerPlayer] = useState(1);
  const [timeLimit, setTimeLimit] = useState(15);
  const [pointsPerQuestion, setPointsPerQuestion] = useState(10); // Изменили дефолт на 10
  const [saving, setSaving] = useState(false);

  const addQuestion = () => {
    setQuestions([...questions, { text: '', options: ['', '', '', ''], correctIndex: 0 }]);
    if (questionsPerPlayer === questions.length) setQuestionsPerPlayer(questions.length + 1);
  };

  const updateQuestion = (qIndex, field, value) => {
    const newQ = [...questions]; newQ[qIndex][field] = value; setQuestions(newQ);
  };
  const updateOption = (qIndex, optIndex, value) => {
    const newQ = [...questions]; newQ[qIndex].options[optIndex] = value; setQuestions(newQ);
  };

  const saveTest = async () => {
    if (!title) return alert("Пожалуйста, введите название теста");
    setSaving(true);
    try {
      await supabase.from('tests').insert([{
        title,
        creatorId: user.id,
        questions,
        questionsPerPlayer: Math.min(questionsPerPlayer, questions.length),
        timeLimit: parseInt(timeLimit) || 15,
        pointsPerQuestion: parseInt(pointsPerQuestion) || 10,
        createdAt: Date.now()
      }]);
      navigate('dashboard');
    } catch (e) { console.error(e); alert("Ошибка при сохранении теста. Проверьте настройки БД."); } 
    finally { setSaving(false); }
  };

  return (
    <PageTransition>
      <div className="flex items-center gap-4 mb-8">
        <button onClick={() => navigate('dashboard')} className="p-2 hover:bg-white/10 rounded-full text-gray-400 hover:text-white transition-colors"><ArrowLeft className="w-6 h-6" /></button>
        <h2 className="text-3xl font-bold text-white">Создание теста</h2>
      </div>

      <Card className="mb-8">
        <label className="block text-sm font-medium text-gray-400 mb-2">Название теста</label>
        <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Например: География мира" className="text-xl" />
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <Card>
          <label className="block text-sm font-medium text-gray-400 mb-2">Время на ответ (секунд)</label>
          <Input type="number" min="5" max="120" value={timeLimit} onChange={e => setTimeLimit(e.target.value)} />
        </Card>
        <Card>
          <label className="block text-sm font-medium text-gray-400 mb-2">Точное количество баллов за вопрос</label>
          <Input type="number" min="1" max="10000" value={pointsPerQuestion} onChange={e => setPointsPerQuestion(e.target.value)} />
        </Card>
      </div>

      <Card className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <label className="text-sm font-medium text-gray-400">Вопросов на одного участника</label>
          <span className="text-xl font-bold text-violet-400">{questionsPerPlayer} из {questions.length}</span>
        </div>
        <input type="range" min="1" max={questions.length || 1} value={questionsPerPlayer} onChange={e => setQuestionsPerPlayer(parseInt(e.target.value))} className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-violet-500" />
      </Card>

      <div className="space-y-8 mb-8">
        {questions.map((q, qIndex) => (
          <Card key={qIndex} className="relative">
            <div className="absolute top-6 right-6 text-gray-500 font-bold">#{qIndex + 1}</div>
            <Input value={q.text} onChange={e => updateQuestion(qIndex, 'text', e.target.value)} placeholder="Введите текст вопроса..." className="mb-6 font-medium" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {q.options.map((opt, optIndex) => (
                <div key={optIndex} className="relative">
                  <Input value={opt} onChange={e => updateOption(qIndex, optIndex, e.target.value)} placeholder={`Вариант ответа ${optIndex + 1}`} className={`pl-12 ${q.correctIndex === optIndex ? 'ring-2 ring-emerald-500 bg-emerald-500/10' : ''}`} />
                  <button onClick={() => updateQuestion(qIndex, 'correctIndex', optIndex)} className={`absolute left-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${q.correctIndex === optIndex ? 'border-emerald-500 bg-emerald-500' : 'border-gray-500 hover:border-gray-400'}`}>
                    {q.correctIndex === optIndex && <CheckCircle2 className="w-4 h-4 text-white" />}
                  </button>
                </div>
              ))}
            </div>
          </Card>
        ))}
      </div>

      <div className="flex justify-between items-center">
        <Button variant="secondary" onClick={addQuestion}><Plus className="w-5 h-5" /> Добавить вопрос</Button>
        <Button onClick={saveTest} disabled={saving}>{saving ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Сохранить тест'}</Button>
      </div>
    </PageTransition>
  );
};

const HostScreen = ({ user, testId, navigate }) => {
  const [sessionId, setSessionId] = useState(null);
  const [isStarting, setIsStarting] = useState(false);
  
  useEffect(() => {
    if (!supabase) return;
    const init = async () => {
      const code = generateGameCode();
      const { data } = await supabase.from('sessions').insert([{
        testId,
        creatorId: user.id,
        gameCode: code,
        status: 'waiting',
        currentRound: 0,
        createdAt: Date.now()
      }]).select().single();
      if (data) setSessionId(data.id);
    };
    init();
  }, [testId, user.id]);

  const [session, refetchSession] = useDocSync('sessions', sessionId);
  const [test] = useDocSync('tests', testId);
  const [players] = useTableSync('players', 'sessionId', sessionId);
  
  const [hostTimeLeft, setHostTimeLeft] = useState(0);

  useEffect(() => {
    if (!supabase || !session || session.status !== 'active' || !test) return;
    let isActive = true;

    if (session.roundState === 'answering') {
      const allAnswered = players.length > 0 && players.every(p => p.answeredRound === session.currentRound);
      const timeRemaining = session.roundEndTime - Date.now();

      if (allAnswered || timeRemaining <= 0) {
        if (isActive) supabase.from('sessions').update({ roundState: 'showing', showingEndTime: Date.now() + 5000 }).eq('id', session.id).then(refetchSession);
      } else {
        const timer = setTimeout(() => {
          if (isActive) supabase.from('sessions').update({ roundState: 'showing', showingEndTime: Date.now() + 5000 }).eq('id', session.id).then(refetchSession);
        }, timeRemaining);
        return () => { isActive = false; clearTimeout(timer); };
      }
    } 
    else if (session.roundState === 'showing') {
      const timeRemaining = session.showingEndTime - Date.now();
      const limit = test.questionsPerPlayer || test.questions.length;

      const nextRound = async () => {
        if (!isActive) return;
        if (session.currentRound + 1 >= limit) {
          await supabase.from('sessions').update({ status: 'finished' }).eq('id', session.id);
        } else {
          await supabase.from('sessions').update({
            currentRound: session.currentRound + 1,
            roundState: 'answering',
            roundEndTime: Date.now() + (test.timeLimit || 15) * 1000
          }).eq('id', session.id);
        }
        refetchSession(); 
      };

      if (timeRemaining <= 0) nextRound();
      else {
        const timer = setTimeout(nextRound, timeRemaining);
        return () => { isActive = false; clearTimeout(timer); };
      }
    }
  }, [session?.roundState, session?.roundEndTime, session?.showingEndTime, session?.currentRound, players, test]);

  useEffect(() => {
    if (session?.status === 'active') {
      const targetTime = session.roundState === 'answering' ? session.roundEndTime : session.showingEndTime;
      const updateTimer = () => setHostTimeLeft(Math.max(0, Math.ceil((targetTime - Date.now()) / 1000)));
      updateTimer();
      const timer = setInterval(updateTimer, 1000);
      return () => clearInterval(timer);
    }
  }, [session?.roundEndTime, session?.showingEndTime, session?.roundState, session?.status]);

  const startGame = async () => {
    if (!supabase || !session || !test) return;
    setIsStarting(true);
    try {
      const timeLimitMs = (test.timeLimit || 15) * 1000;
      const { error } = await supabase.from('sessions').update({ 
        status: 'active', 
        currentRound: 0, 
        roundState: 'answering', 
        roundEndTime: Date.now() + timeLimitMs
      }).eq('id', session.id);
      
      if (error) throw error;
      await refetchSession(); 
    } catch (e) {
      console.error(e);
      alert("Ошибка при запуске игры: " + e.message);
    } finally {
      setIsStarting(false);
    }
  };

  const stopGame = async () => {
    if (!supabase || !session) return;
    await supabase.from('sessions').update({ status: 'finished' }).eq('id', session.id);
    await refetchSession(); 
  };

  if (!session) return <div className="flex justify-center mt-20"><Loader2 className="w-10 h-10 animate-spin text-white" /></div>;

  return (
    <PageTransition>
      {session.status === 'waiting' ? (
        <div className="text-center">
          <Card className="max-w-xl mx-auto mb-10 text-center py-8 md:py-12">
            <h2 className="text-gray-400 text-lg md:text-xl font-medium mb-4">ПИН-код для подключения</h2>
            <div className="text-5xl sm:text-7xl md:text-8xl font-black text-white tracking-widest drop-shadow-[0_0_30px_rgba(139,92,246,0.5)] break-all">{session.gameCode}</div>
          </Card>
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-2xl font-bold text-white flex items-center gap-2"><Users className="w-6 h-6 text-violet-400" /> Участники ({players.length})</h3>
            <Button onClick={startGame} disabled={players.length === 0 || isStarting} className="px-8">
              {isStarting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Начать игру'}
            </Button>
          </div>
          <div className="flex flex-wrap gap-4">
            <AnimatePresence>
              {players.map(p => (
                <motion.div key={p.id} initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white/10 px-6 py-3 rounded-full text-white font-medium border border-white/5 shadow-lg">{p.nickname}</motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      ) : (
        <div className="w-full max-w-4xl mx-auto">
           <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
            <h2 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-3">
              {session.status === 'active' ? <><div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" /> {session.roundState === 'answering' ? 'Идет прием ответов...' : 'Результаты раунда'}</> : <><Trophy className="w-8 h-8 text-yellow-400" /> Игра завершена</>}
            </h2>
            <div className="flex items-center gap-4">
              {session.status === 'active' && (
                <div className="text-lg bg-black/30 px-4 py-2 rounded-xl border border-white/10">
                  <span className="text-gray-400">{session.roundState === 'answering' ? 'Осталось: ' : 'След. раунд: '}</span>
                  <span className="font-bold text-white ml-1">{hostTimeLeft} сек</span>
                </div>
              )}
              {session.status === 'active' && <Button variant="danger" onClick={stopGame}>Завершить досрочно</Button>}
            </div>
          </div>
          <Card>
            <h3 className="text-xl font-bold text-gray-300 mb-2">{session.status === 'active' ? 'Рейтинг в реальном времени' : 'Итоговая таблица лидеров'}</h3>
            <Leaderboard players={players} />
          </Card>
        </div>
      )}
    </PageTransition>
  );
};

const JoinGame = ({ navigate }) => {
  const [code, setCode] = useState('');
  const [nickname, setNickname] = useState('');
  const [error, setError] = useState('');
  const [joining, setJoining] = useState(false);

  const handleJoin = async () => {
    if (!code || !nickname) return setError("Заполните все поля");
    setJoining(true); setError('');

    try {
      const { data: allSessions } = await supabase.from('sessions').select('*');
      const session = allSessions?.find(s => s.gameCode === code && s.status !== 'finished');

      if (!session) { setJoining(false); return setError("Игра не найдена или уже завершена"); }

      const { data: playerDoc, error: pError } = await supabase.from('players').insert([{
        sessionId: session.id,
        nickname,
        score: 0,
        answeredRound: -1,
        joinedAt: Date.now()
      }]).select().single();
      
      if (pError) throw pError;

      navigate('play', { sessionId: session.id, playerId: playerDoc.id, testId: session.testId });
    } catch (e) { console.error(e); setError("Произошла ошибка при подключении"); setJoining(false); }
  };

  return (
    <PageTransition className="flex items-center justify-center min-h-[60vh]">
      <Card className="w-full max-w-md">
        <h2 className="text-3xl font-bold text-center text-white mb-8">Подключение</h2>
        {error && <div className="bg-rose-500/20 border border-rose-500 text-rose-200 p-3 rounded-xl mb-6 text-center text-sm">{error}</div>}
        <div className="space-y-4 mb-8">
          <Input value={code} onChange={e => setCode(e.target.value.toUpperCase())} placeholder="ПИН-код игры (6 цифр)" className="text-center text-2xl tracking-widest uppercase font-bold" type="text" maxLength={6} />
          <Input value={nickname} onChange={e => setNickname(e.target.value)} placeholder="Ваш никнейм" className="text-center text-lg font-medium" maxLength={15} />
        </div>
        <Button onClick={handleJoin} className="w-full py-4 text-lg" disabled={joining}>{joining ? <Loader2 className="w-6 h-6 animate-spin" /> : 'Присоединиться к игре'}</Button>
      </Card>
    </PageTransition>
  );
};

const PlayGame = ({ sessionId, playerId, testId }) => {
  const [session, refetchSession] = useDocSync('sessions', sessionId);
  const [player, refetchPlayer] = useDocSync('players', playerId);
  const [test] = useDocSync('tests', testId);
  const [allPlayers] = useTableSync('players', 'sessionId', sessionId);
  
  const [shuffledQuestions, setShuffledQuestions] = useState([]);
  const [selectedOption, setSelectedOption] = useState(null);
  
  // ИСПРАВЛЕНИЕ #1: Локальный таймер для телефона (независимый от часов компьютера)
  const [localTimeLeft, setLocalTimeLeft] = useState(0);

  useEffect(() => {
    if (test && !shuffledQuestions.length) {
      const limit = test.questionsPerPlayer || test.questions.length;
      const shuffled = [...test.questions].sort(() => Math.random() - 0.5).slice(0, limit);
      setShuffledQuestions(shuffled);
    }
  }, [test, shuffledQuestions.length]);

  // Запуск локального визуального таймера при смене состояния раунда
  useEffect(() => {
    if (session?.status === 'active') {
      if (session.roundState === 'answering') {
        setLocalTimeLeft(test?.timeLimit || 15);
        const timer = setInterval(() => {
          setLocalTimeLeft(prev => (prev > 0 ? prev - 1 : 0));
        }, 1000);
        return () => clearInterval(timer);
      } else if (session.roundState === 'showing') {
        setLocalTimeLeft(0);
      }
    }
  }, [session?.roundState, session?.currentRound, test?.timeLimit, session?.status]);

  useEffect(() => { setSelectedOption(null); }, [session?.currentRound]);

  if (!session || !test || !player || !shuffledQuestions.length) return <div className="mt-20 flex justify-center"><Loader2 className="w-10 h-10 animate-spin text-white" /></div>;

  if (session.status === 'waiting') {
    return (
      <PageTransition className="flex items-center justify-center min-h-[60vh] text-center">
        <div>
          <div className="w-24 h-24 mx-auto bg-white/10 rounded-full flex items-center justify-center mb-8 relative">
            <div className="absolute inset-0 rounded-full border-4 border-violet-500 border-t-transparent animate-spin"></div>
            <span className="text-3xl font-bold text-white">{player.nickname[0].toUpperCase()}</span>
          </div>
          <h2 className="text-3xl font-bold text-white mb-2">Вы в игре!</h2>
          <p className="text-gray-400 text-lg">Ожидаем, пока ведущий запустит тест...</p>
        </div>
      </PageTransition>
    );
  }

  if (session.status === 'finished') {
    return (
      <PageTransition className="text-center mt-4 md:mt-10 w-full max-w-3xl mx-auto">
        <Trophy className="w-24 h-24 md:w-32 md:h-32 text-yellow-400 mx-auto mb-6 drop-shadow-[0_0_30px_rgba(250,204,21,0.5)]" />
        <h2 className="text-4xl md:text-5xl font-black text-white mb-2">Игра завершена!</h2>
        <p className="text-xl md:text-2xl text-gray-300 mb-8">Итоговый рейтинг:</p>
        <Card className="text-left w-full"><Leaderboard players={allPlayers} currentPlayerId={playerId} /></Card>
      </PageTransition>
    );
  }

  const currentQ = shuffledQuestions[session.currentRound];
  if (!currentQ) return null;

  const isAnswering = session.roundState === 'answering';
  const isShowing = session.roundState === 'showing';
  const hasAnswered = player.answeredRound === session.currentRound;

  const handleAnswer = async (optIndex) => {
    if (!isAnswering || hasAnswered || !supabase) return;
    setSelectedOption(optIndex);
    
    try {
      const isCorrect = optIndex === currentQ.correctIndex;
      
      // ИСПРАВЛЕНИЕ #2: Фиксированные баллы за ответ без штрафа за время
      const pointsEarned = isCorrect ? (test.pointsPerQuestion || 10) : 0;

      const { error } = await supabase.from('players').update({ 
        score: (player.score || 0) + pointsEarned, answeredRound: session.currentRound 
      }).eq('id', playerId);
      
      if (error) throw error;
      await refetchPlayer(); 
    } catch (e) {
      alert("Не удалось отправить ответ: " + e.message);
      setSelectedOption(null); 
    }
  };

  return (
    <PageTransition className="flex flex-col h-[calc(100vh-100px)] md:h-[calc(100vh-120px)]">
      <div className="w-full bg-white/10 h-2 md:h-3 rounded-full mb-4 overflow-hidden shadow-inner shrink-0">
        <motion.div className="h-full bg-gradient-to-r from-violet-500 to-fuchsia-500" initial={{ width: `${(session.currentRound / shuffledQuestions.length) * 100}%` }} animate={{ width: `${((session.currentRound + (isShowing ? 1 : 0)) / shuffledQuestions.length) * 100}%` }} transition={{ duration: 0.5, ease: "easeInOut" }} />
      </div>

      <div className="flex justify-between items-center mb-4 md:mb-8 text-sm md:text-base gap-2 shrink-0">
        <div className="bg-white/10 px-4 md:px-6 py-2 rounded-full font-bold text-white border border-white/10 shadow-inner whitespace-nowrap"><span className="hidden sm:inline">Вопрос </span>{session.currentRound + 1} / {shuffledQuestions.length}</div>
        <div className={`text-3xl md:text-4xl font-black flex items-center gap-2 ${localTimeLeft <= 5 && isAnswering ? 'text-rose-500 animate-pulse' : 'text-white'}`}>
          <Clock className="w-6 h-6 md:w-8 md:h-8" /> {isShowing ? '0' : localTimeLeft}
        </div>
        <div className="bg-black/30 px-4 md:px-6 py-2 rounded-full font-bold text-violet-400 border border-violet-500/30 whitespace-nowrap">{player.score} <span className="hidden sm:inline">баллов</span></div>
      </div>

      {hasAnswered && isAnswering && <div className="text-center mb-4 text-emerald-400 font-bold animate-pulse text-sm md:text-base">Ваш ответ принят. Ожидаем остальных...</div>}
      {!hasAnswered && isShowing && <div className="text-center mb-4 text-rose-400 font-bold text-sm md:text-base">Время вышло! Ответ не засчитан.</div>}

      <Card className="flex-1 flex items-center justify-center mb-4 md:mb-8 text-center bg-white/5 backdrop-blur-2xl overflow-y-auto min-h-[150px]">
        <h2 className="text-2xl md:text-4xl lg:text-5xl font-bold text-white leading-tight">{currentQ.text}</h2>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4 shrink-0 pb-4">
        {currentQ.options.map((opt, idx) => {
          let stateClass = '';
          if (isShowing) {
            if (idx === currentQ.correctIndex) stateClass = 'ring-4 ring-emerald-500 opacity-100 z-10 scale-[1.02] bg-emerald-500/20';
            else if (idx === selectedOption) stateClass = 'ring-4 ring-rose-500 opacity-50 bg-rose-500/20';
            else stateClass = 'opacity-30 grayscale';
          } else if (hasAnswered) {
            if (idx === selectedOption) stateClass = 'ring-4 ring-white/50 opacity-100 scale-[1.02]';
            else stateClass = 'opacity-30 grayscale';
          }

          return (
            <motion.button key={idx} whileTap={isAnswering && !hasAnswered ? { scale: 0.95 } : {}} onClick={() => handleAnswer(idx)} disabled={!isAnswering || hasAnswered} className={`relative overflow-hidden min-h-[80px] md:min-h-[100px] rounded-2xl flex items-center justify-center p-4 md:p-6 text-lg md:text-2xl font-bold text-white shadow-xl transition-all duration-300 ${cardColors[idx]} ${stateClass}`}>
              <div className="relative z-10 break-words w-full">{opt}</div>
            </motion.button>
          );
        })}
      </div>
    </PageTransition>
  );
};

// --- ГЛАВНЫЙ КОМПОНЕНТ APP ---
export default function App() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [supabaseLoaded, setSupabaseLoaded] = useState(false);
  
  // Инициализация стейта для роутера
  const [route, setRoute] = useState({ path: 'home', params: {} });

  useEffect(() => {
    // 1. Инициализация Supabase
    let sub = null;
    const initSupabase = () => {
      if (!supabase) {
        supabase = window.supabase.createClient(supabaseUrl, supabaseKey);
      }
      setSupabaseLoaded(true);
      supabase.auth.getSession().then(({ data: { session } }) => {
        setUser(session?.user ?? null);
        setAuthLoading(false);
      });
      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        setUser(session?.user ?? null);
      });
      sub = subscription;
    };

    if (window.supabase) {
      initSupabase();
    } else {
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/@supabase/supabase-js@2';
      script.onload = initSupabase;
      document.head.appendChild(script);
    }

    // 2. Интеграция с History API для работы кнопки "Назад" на телефонах
    window.history.replaceState({ path: 'home', params: {} }, '');

    const handlePopState = (event) => {
      if (event.state && event.state.path) {
        setRoute({ path: event.state.path, params: event.state.params || {} });
      } else {
        setRoute({ path: 'home', params: {} });
      }
    };

    window.addEventListener('popstate', handlePopState);

    return () => { 
      if (sub) sub.unsubscribe(); 
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  const navigate = (path, params = {}) => {
    window.history.pushState({ path, params }, '', '#' + path);
    setRoute({ path, params });
  };

  const renderView = () => {
    if (!supabaseLoaded || authLoading) return <div className="flex justify-center items-center h-screen"><Loader2 className="w-12 h-12 animate-spin text-white" /></div>;
    switch (route.path) {
      case 'home': return <Home navigate={navigate} isCreator={!!user} />;
      case 'auth': return <AuthScreen navigate={navigate} />;
      case 'dashboard': return <Dashboard user={user} navigate={navigate} />;
      case 'create-test': return <CreateTest user={user} navigate={navigate} />;
      case 'host': return <HostScreen user={user} testId={route.params.testId} navigate={navigate} />;
      case 'join': return <JoinGame navigate={navigate} />;
      case 'play': return <PlayGame sessionId={route.params.sessionId} playerId={route.params.playerId} testId={route.params.testId} />;
      default: return <Home navigate={navigate} isCreator={!!user} />;
    }
  };

  const handleLogout = async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    navigate('home');
  };

  return (
    <div className="min-h-screen text-slate-100 font-sans selection:bg-violet-500/30">
      
      {/* ГЛОБАЛЬНЫЕ СТИЛИ ДЛЯ ФИКСА СКРОЛЛА НА ТЕЛЕФОНАХ */}
      <style dangerouslySetInnerHTML={{__html: `
        body, html {
          background-color: #020617; /* Темный цвет, как у приложения */
          overscroll-behavior-y: none; /* Отключает эффект "резиновой нити" (bounce) */
          -webkit-text-size-adjust: 100%;
        }
      `}} />

      <Background />
      <header className="px-6 py-4 flex justify-between items-center backdrop-blur-md bg-black/10 border-b border-white/5 sticky top-0 z-50">
        <div className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-violet-400 to-fuchsia-400 cursor-pointer flex items-center gap-2" onClick={() => navigate('home')}>
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-white shadow-lg">Q</div>
          QuizFlow
        </div>
        {user && route.path !== 'home' && route.path !== 'join' && route.path !== 'play' && (
          <div className="flex items-center gap-4">
            <div className="text-sm text-gray-400 hidden md:block">{user.email}</div>
            <Button variant="secondary" onClick={handleLogout} className="!py-2 !px-4 text-sm"><LogOut className="w-4 h-4" /> Выйти</Button>
          </div>
        )}
      </header>
      <main className="p-4 md:p-12 relative z-10">
        <AnimatePresence mode="wait">{renderView()}</AnimatePresence>
      </main>
    </div>
  );
}
