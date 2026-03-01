import React, { useState, useEffect, useRef } from 'react';
import { initializeApp } from 'firebase/app';
import { getAnalytics } from "firebase/analytics";
import { 
  getAuth, 
  onAuthStateChanged, 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  setPersistence,
  browserLocalPersistence,
  signInWithCustomToken
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc, 
  collection, 
  query, 
  onSnapshot, 
  updateDoc, 
  deleteDoc,
  addDoc,
  arrayUnion
} from 'firebase/firestore';
import { 
  getStorage, 
  ref as storageRef, 
  uploadBytesResumable, 
  getDownloadURL 
} from 'firebase/storage';
import { 
  LayoutDashboard, 
  BookOpen, 
  Users, 
  Settings, 
  LogOut, 
  Plus, 
  Trash2, 
  Calendar, 
  FileText, 
  PlayCircle, 
  Image as ImageIcon, 
  ChevronRight,
  GraduationCap,
  Music,
  Link as LinkIcon,
  Menu,
  X,
  Mail,
  Lock,
  User as UserIcon,
  UploadCloud,
  File as FileIcon,
  ImagePlus,
  Clock
} from 'lucide-react';

// --- ROBUST ENVIRONMENT CONFIGURATION ---
const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {
  apiKey: "AIzaSyBaDBLoe2Wi2WgmJfPRXoEP-ZSgkVhMxVI",
  authDomain: "musicoul-15025.firebaseapp.com",
  databaseURL: "https://musicoul-15025-default-rtdb.firebaseio.com",
  projectId: "musicoul-15025",
  storageBucket: "musicoul-15025.firebasestorage.app",
  messagingSenderId: "863099041367",
  appId: "1:863099041367:web:c3d61399489a219611d512",
  measurementId: "G-WBPE697N9Q"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);
const appId = typeof __app_id !== 'undefined' ? __app_id : 'musicoul-prod';

// --- STYLES INJECTION (Gilded Dark Theme) ---
const injectStyles = () => {
  if (document.getElementById('musicoul-styles')) return;
  const style = document.createElement('style');
  style.id = 'musicoul-styles';
  style.innerHTML = `
    @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;0,700;1,400;1,600&family=Inter:wght@300;400;600;800&display=swap');
    
    .serif { font-family: 'Cormorant Garamond', serif; }
    .sans { font-family: 'Inter', sans-serif; }
    
    .bg-app { background-color: #070707; }
    .text-gold { color: #D4AF37; }
    .bg-gold { background-color: #D4AF37; }
    
    .glass { 
      background: rgba(255, 255, 255, 0.02); 
      border: 1px solid rgba(255, 255, 255, 0.05); 
      backdrop-filter: blur(10px); 
    }
    
    .gold-gradient-text {
      background: linear-gradient(to right, #D4AF37, #F9E29D, #D4AF37);
      -webkit-background-clip: text;
      background-clip: text;
      color: transparent;
    }

    ::-webkit-scrollbar { width: 6px; }
    ::-webkit-scrollbar-track { background: transparent; }
    ::-webkit-scrollbar-thumb { background: rgba(212, 175, 55, 0.3); border-radius: 10px; }
    ::-webkit-scrollbar-thumb:hover { background: rgba(212, 175, 55, 0.6); }

    /* Custom Input File Styling */
    input[type="file"]::file-selector-button {
      border: none;
      background: rgba(212, 175, 55, 0.1);
      color: #D4AF37;
      padding: 8px 16px;
      border-radius: 8px;
      font-size: 10px;
      font-weight: bold;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      cursor: pointer;
      margin-right: 16px;
      transition: all 0.3s ease;
    }
    input[type="file"]::file-selector-button:hover {
      background: rgba(212, 175, 55, 0.2);
    }
  `;
  document.head.appendChild(style);
};

// --- HELPERS ---
const toast = (msg) => {
  const t = document.createElement('div');
  t.className = "fixed bottom-6 right-6 md:top-10 md:right-10 md:bottom-auto glass text-[#D4AF37] px-6 py-4 rounded-xl font-bold text-[10px] tracking-[0.2em] uppercase z-[9999] shadow-2xl transition-all duration-300 animate-in fade-in slide-in-from-bottom-5 md:slide-in-from-top-5 border border-[#D4AF37]/30";
  t.innerText = msg;
  document.body.appendChild(t);
  setTimeout(() => {
    t.style.opacity = '0';
    setTimeout(() => t.remove(), 300);
  }, 4000);
};

const getYoutubeEmbedUrl = (url) => {
  if (!url) return '';
  let videoId = '';
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  if (match && match[2].length === 11) {
    videoId = match[2];
  }
  return videoId ? `https://www.youtube.com/embed/${videoId}?autoplay=1` : url;
};

export default function App() {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  
  // App State
  const [allUsers, setAllUsers] = useState([]);
  const [allCourses, setAllCourses] = useState([]);

  useEffect(() => {
    injectStyles();
    try { getAnalytics(app); } catch (e) {}

    let unsubscribe = () => {};

    const initializeSession = async () => {
      try {
        await setPersistence(auth, browserLocalPersistence);
      } catch (err) {
        console.error("Persistence setting failed:", err);
      }
      
      // Handle potential seamless token login
      if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
        try { await signInWithCustomToken(auth, __initial_auth_token); } catch(e) {}
      }

      unsubscribe = onAuthStateChanged(auth, async (u) => {
        if (u) {
          setUser(u);
          try {
            const profileSnap = await getDoc(doc(db, 'artifacts', appId, 'users', u.uid, 'profile', 'info'));
            if (profileSnap.exists()) {
              setUserData(profileSnap.data());
            } else {
              const fallbackProfile = {
                name: u.displayName || u.email?.split('@')[0] || "Scholar",
                email: u.email || '',
                roles: ['student'],
                enrolledCourses: [],
                createdAt: new Date().toISOString()
              };
              try {
                // Ignore failure if operating entirely offline initially
                await setDoc(doc(db, 'artifacts', appId, 'users', u.uid, 'profile', 'info'), fallbackProfile);
                await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'users', u.uid), fallbackProfile);
              } catch (e) {
                console.warn("Storage warning (queued offline):", e);
              }
              setUserData(fallbackProfile);
            }
          } catch (err) {
            console.error("Profile fetch error:", err);
            // CRITICAL FIX: If Firestore fetching times out due to network issues, 
            // populate userData with a temporary fallback so the app continues loading.
            setUserData({
              name: u.displayName || u.email?.split('@')[0] || "Scholar",
              email: u.email || '',
              roles: ['student'], 
              enrolledCourses: [],
              createdAt: new Date().toISOString()
            });
            toast("Connection slow. Operating in offline mode.");
          }
        } else {
          setUser(null);
          setUserData(null);
        }
        setAuthLoading(false);
      });
    };

    initializeSession();
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user || !userData) return; 

    const qUsers = query(collection(db, 'artifacts', appId, 'public', 'data', 'users'));
    const qCourses = query(collection(db, 'artifacts', appId, 'public', 'data', 'courses'));

    const unsubUsers = onSnapshot(qUsers, 
      (snap) => {
        setAllUsers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      },
      (error) => {
        console.error("Users snapshot error (offline mode):", error);
      }
    );

    const unsubCourses = onSnapshot(qCourses, 
      (snap) => {
        setAllCourses(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      },
      (error) => {
        console.error("Courses snapshot error (offline mode):", error);
      }
    );

    return () => { unsubUsers(); unsubCourses(); };
  }, [user, userData]);

  const logout = () => signOut(auth);

  if (authLoading) {
    return (
      <div className="bg-app text-white min-h-screen flex items-center justify-center font-sans">
        <div className="flex flex-col items-center gap-6">
          <div className="w-16 h-16 border-2 border-[#D4AF37]/20 border-t-[#D4AF37] rounded-full animate-spin" />
          <h2 className="serif text-2xl text-gold italic">Tuning Instruments...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-app text-white min-h-screen sans selection:bg-[#D4AF37] selection:text-black font-light text-gray-300 flex">
      {!user || !userData ? (
        <AuthScreen db={db} allUsers={allUsers} setAuthLoading={setAuthLoading} setUserData={setUserData} />
      ) : (
        <MainApplication 
          user={user} 
          userData={userData} 
          allUsers={allUsers} 
          allCourses={allCourses} 
          logout={logout}
          updateLocalRole={(newRole) => setUserData({...userData, roles: [newRole]})}
        />
      )}
    </div>
  );
}

// --- AUTHENTICATION SCREEN ---
function AuthScreen({ db, allUsers, setAuthLoading, setUserData }) {
  const [isLogin, setIsLogin] = useState(true);

  const handleAuth = async (e) => {
    e.preventDefault();
    setAuthLoading(true);
    const form = e.target;
    const email = form.email.value;
    const password = form.password.value;
    const name = form.name?.value;

    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
        toast("Welcome Back");
      } else {
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        const isFirstUser = allUsers.length === 0; 
        const initialRole = isFirstUser ? 'admin' : 'student';

        const newProfile = {
          name: name,
          email: email,
          roles: [initialRole],
          enrolledCourses: [],
          createdAt: new Date().toISOString()
        };

        try {
          await setDoc(doc(db, 'artifacts', appId, 'users', cred.user.uid, 'profile', 'info'), newProfile);
          await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'users', cred.user.uid), newProfile);
        } catch (storageErr) {
          console.warn("Storage warning (queued offline):", storageErr);
        }
        
        setUserData(newProfile);
        toast(`Welcome to Musicoul, ${name}`);
      }
    } catch (err) {
      if (err.code === 'auth/email-already-in-use') {
        toast("Email already registered. Please login.");
        setIsLogin(true);
      } else if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found') {
        toast("Invalid email or password.");
      } else if (err.code === 'auth/weak-password') {
        toast("Password should be at least 6 characters.");
      } else {
        toast("Authentication Failed. Please try again.");
      }
      setAuthLoading(false);
    }
  };

  return (
    <div className="w-full min-h-screen flex items-center justify-center p-4 md:p-6 bg-[url('https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center">
      <div className="absolute inset-0 bg-[#070707]/90 backdrop-blur-md z-0"></div>
      
      <div className="glass p-8 md:p-16 rounded-[2rem] w-full max-w-md z-10 relative overflow-hidden border-[#D4AF37]/20 shadow-2xl">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent opacity-50"></div>
        
        <div className="text-center mb-10">
          <Music size={40} className="text-[#D4AF37] mx-auto mb-6" />
          <h1 className="serif text-4xl md:text-5xl mb-2 italic text-white">The Musicoul</h1>
          <p className="text-[#D4AF37] text-[9px] tracking-[0.4em] uppercase font-bold">Premier Conservatory</p>
        </div>
        
        <form onSubmit={handleAuth} className="space-y-5">
          {!isLogin && (
            <div className="relative">
              <UserIcon size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
              <input name="name" type="text" placeholder="FULL NAME" required className="w-full bg-black/40 border border-white/10 py-4 pl-12 pr-4 rounded-xl text-[11px] tracking-widest uppercase outline-none focus:border-[#D4AF37] transition-all text-white placeholder:text-gray-600 focus:bg-white/5" />
            </div>
          )}
          <div className="relative">
            <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
            <input name="email" type="email" placeholder="EMAIL ADDRESS" required className="w-full bg-black/40 border border-white/10 py-4 pl-12 pr-4 rounded-xl text-[11px] tracking-widest uppercase outline-none focus:border-[#D4AF37] transition-all text-white placeholder:text-gray-600 focus:bg-white/5" />
          </div>
          <div className="relative">
            <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
            <input name="password" type="password" placeholder="PASSPHRASE" required minLength="6" className="w-full bg-black/40 border border-white/10 py-4 pl-12 pr-4 rounded-xl text-[11px] tracking-widest uppercase outline-none focus:border-[#D4AF37] transition-all text-white placeholder:text-gray-600 focus:bg-white/5" />
          </div>
          
          <button type="submit" className="w-full bg-[#D4AF37] py-4 rounded-xl text-black font-bold text-[10px] tracking-[0.3em] uppercase hover:bg-[#F9E29D] transition-colors mt-4">
            {isLogin ? 'Enter Sanctuary' : 'Enroll Now'}
          </button>
        </form>

        <div className="mt-8 text-center">
          <button onClick={() => setIsLogin(!isLogin)} className="text-gray-400 hover:text-white text-[10px] uppercase tracking-widest transition-colors border-b border-transparent hover:border-[#D4AF37] pb-1">
            {isLogin ? "New to Musicoul? Enroll Here" : "Already Enrolled? Login"}
          </button>
        </div>
      </div>
    </div>
  );
}

// --- MAIN APPLICATION SHELL ---
function MainApplication({ user, userData, allUsers, allCourses, logout, updateLocalRole }) {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const role = userData.roles[0] || 'student';

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setIsMobileMenuOpen(false);
  };

  return (
    <div className="flex flex-col lg:flex-row w-full h-screen overflow-hidden relative">
      {/* MOBILE HEADER */}
      <div className="lg:hidden flex items-center justify-between p-4 border-b border-white/5 bg-[#0a0a0a] z-40">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-[#D4AF37] rounded-full flex items-center justify-center">
            <Music size={14} className="text-black" />
          </div>
          <h4 className="serif text-xl font-bold text-white tracking-wide">Musicoul</h4>
        </div>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 text-gray-300 hover:text-white">
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {isMobileMenuOpen && (
        <div className="fixed inset-0 bg-black/80 z-40 lg:hidden backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)} />
      )}

      {/* SIDEBAR */}
      <aside className={`fixed inset-y-0 left-0 z-50 transform ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} lg:relative lg:translate-x-0 transition-transform duration-300 w-64 lg:w-72 border-r border-white/5 bg-[#0a0a0a] flex flex-col p-6 shadow-2xl lg:shadow-none`}>
        <div className="hidden lg:flex items-center gap-4 mb-12 px-2">
          <div className="w-12 h-12 bg-[#D4AF37] rounded-full flex items-center justify-center shrink-0 shadow-[0_0_20px_rgba(212,175,55,0.3)]">
            <Music size={20} className="text-black" />
          </div>
          <div>
            <h4 className="serif text-2xl font-bold text-white tracking-wide">Musicoul</h4>
            <p className="text-[#D4AF37] text-[9px] tracking-[0.2em] uppercase font-bold">{role}</p>
          </div>
        </div>

        <nav className="flex-1 space-y-2 overflow-y-auto pr-2 custom-scrollbar">
          {role === 'student' && (
            <SidebarItem icon={<LayoutDashboard size={20}/>} label="My Dashboard" active={activeTab === 'dashboard'} onClick={() => handleTabChange('dashboard')} />
          )}

          {role === 'teacher' && (
            <>
              <SidebarItem icon={<LayoutDashboard size={20}/>} label="Teaching Hub" active={activeTab === 'dashboard'} onClick={() => handleTabChange('dashboard')} />
              <SidebarItem icon={<Calendar size={20}/>} label="Attendance" active={activeTab === 'attendance'} onClick={() => handleTabChange('attendance')} />
            </>
          )}

          {role === 'admin' && (
            <>
              <div className="text-[9px] text-gray-500 font-bold uppercase tracking-[0.3em] mt-4 lg:mt-8 mb-4 px-4">Administration</div>
              <SidebarItem icon={<LayoutDashboard size={20}/>} label="Conservatory View" active={activeTab === 'dashboard'} onClick={() => handleTabChange('dashboard')} />
              <SidebarItem icon={<Users size={20}/>} label="User Directory" active={activeTab === 'manage-users'} onClick={() => handleTabChange('manage-users')} />
              <SidebarItem icon={<BookOpen size={20}/>} label="Course Registry" active={activeTab === 'manage-courses'} onClick={() => handleTabChange('manage-courses')} />
            </>
          )}
        </nav>

        {/* Simulator */}
        <div className="mt-8 mb-4 glass p-4 rounded-xl border-[#D4AF37]/20">
          <p className="text-[8px] text-[#D4AF37] uppercase tracking-[0.2em] mb-3 font-bold flex items-center gap-2">
            <Settings size={10} /> Simulator
          </p>
          <div className="flex gap-1 bg-black/50 p-1 rounded-lg">
            {['student', 'teacher', 'admin'].map(r => (
              <button 
                key={r} onClick={() => updateLocalRole(r)}
                className={`flex-1 py-2 rounded text-[7px] md:text-[8px] tracking-wider font-bold transition-all uppercase ${role === r ? 'bg-[#D4AF37] text-black' : 'text-gray-500 hover:text-white'}`}
              >
                {r.substring(0,3)}
              </button>
            ))}
          </div>
        </div>

        <button onClick={logout} className="flex items-center gap-4 p-4 text-gray-500 hover:text-[#D4AF37] transition-all text-[10px] font-bold tracking-widest uppercase w-full rounded-xl hover:bg-white/5 mt-auto">
          <LogOut size={20}/> <span>Depart</span>
        </button>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 h-[calc(100vh-65px)] lg:h-screen overflow-y-auto bg-gradient-to-b from-[#0a0a0a] to-[#050505] relative">
        <div className="p-4 sm:p-8 md:p-12 lg:p-16 max-w-7xl mx-auto min-h-full">
          {(role === 'student' || role === 'admin') && activeTab === 'dashboard' && <StudentDashboard user={user} userData={userData} courses={allCourses} />}
          {role === 'teacher' && activeTab === 'dashboard' && <TeacherDashboard user={user} userData={userData} courses={allCourses} users={allUsers} />}
          {role === 'teacher' && activeTab === 'attendance' && <TeacherAttendance user={user} userData={userData} courses={allCourses} users={allUsers} />}
          {role === 'admin' && activeTab === 'manage-users' && <AdminUsers users={allUsers} courses={allCourses} />}
          {role === 'admin' && activeTab === 'manage-courses' && <AdminCourses courses={allCourses} />}
        </div>
      </main>
    </div>
  );
}

function SidebarItem({ icon, label, active, onClick }) {
  return (
    <button 
      onClick={onClick} 
      className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all duration-300 group ${
        active 
          ? 'bg-gradient-to-r from-[#D4AF37]/10 to-transparent text-[#D4AF37] border-l-2 border-[#D4AF37]' 
          : 'text-gray-500 hover:text-gray-200 hover:bg-white/5 border-l-2 border-transparent'
      }`}
    >
      <span className={active ? 'text-[#D4AF37]' : 'group-hover:text-white transition-colors'}>{icon}</span>
      <span className="text-[10px] md:text-[11px] font-bold tracking-[0.15em] uppercase">{label}</span>
    </button>
  );
}


// ==========================================
// STUDENT VIEWS & PREVIEWERS
// ==========================================
function StudentDashboard({ user, userData, courses }) {
  const [activeCourseId, setActiveCourseId] = useState(null);
  const [previewResource, setPreviewResource] = useState(null);

  const activeCourse = courses.find(c => c.id === activeCourseId);
  const myCourses = courses.filter(c => userData.enrolledCourses?.includes(c.id));

  if (activeCourse) {
    return (
      <>
        <CourseViewer 
          course={activeCourse} 
          user={user} 
          onBack={() => setActiveCourseId(null)} 
          onViewResource={setPreviewResource}
        />
        {previewResource && (
          <ResourcePreviewer resource={previewResource} onClose={() => setPreviewResource(null)} />
        )}
      </>
    );
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
      <header className="mb-10 md:mb-16">
        <h1 className="serif text-4xl md:text-5xl lg:text-7xl mb-4 text-white leading-tight">Welcome, <br className="md:hidden"/><span className="gold-gradient-text italic">{userData.name?.split(' ')[0] || "Scholar"}</span></h1>
        <p className="text-gray-400 text-[9px] md:text-[11px] tracking-[0.4em] uppercase font-bold flex items-center gap-2">
          <GraduationCap size={14} className="text-[#D4AF37]" /> {userData.roles.includes('admin') ? 'Administrator Conservatory View' : 'Student Portal'}
        </p>
      </header>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-12 md:mb-16">
        <StatCard title="Enrolled Tracks" value={myCourses.length} />
        <StatCard title="Academic Standing" value="Excellent" valueSize="text-3xl md:text-4xl" />
        <StatCard title="Conservatory Status" value="Active" valueSize="text-3xl md:text-4xl" className="sm:col-span-2 lg:col-span-1" />
      </div>

      <div className="mb-8 md:mb-12">
        <h3 className="serif text-3xl md:text-4xl italic text-white">Your Repertoire</h3>
      </div>

      {myCourses.length === 0 ? (
        <div className="glass p-8 md:p-16 rounded-[2rem] text-center border-[#D4AF37]/10">
          <BookOpen size={48} className="mx-auto text-gray-600 mb-6" />
          <h4 className="serif text-2xl md:text-3xl mb-2 text-gray-300">Awaiting Assignment</h4>
          <p className="text-gray-500 text-xs uppercase tracking-widest">
            {userData.roles.includes('admin') ? 'Assign yourself courses in the User Directory.' : 'Please consult administration for course placement.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          {myCourses.map(course => (
            <button 
              key={course.id}
              onClick={() => setActiveCourseId(course.id)}
              className="glass p-6 md:p-8 rounded-[2rem] text-left hover:border-[#D4AF37]/50 transition-all duration-300 group relative overflow-hidden flex flex-col min-h-[250px]"
            >
              {course.coverImage ? (
                <div className="absolute inset-0 z-0 opacity-20 group-hover:opacity-30 transition-opacity duration-500">
                  <img src={course.coverImage} alt={course.title} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/80 to-transparent"></div>
                </div>
              ) : (
                <div className="absolute top-0 right-0 w-24 md:w-32 h-24 md:h-32 bg-[#D4AF37]/5 rounded-bl-full -mr-10 -mt-10 transition-transform group-hover:scale-110 z-0"></div>
              )}
              
              <div className="relative z-10 flex-1 flex flex-col">
                <h4 className="serif text-2xl md:text-3xl mb-3 text-white group-hover:text-[#D4AF37] transition-colors pr-8">{course.title}</h4>
                <p className="text-gray-400 text-xs md:text-sm mb-8 line-clamp-2 font-light leading-relaxed">{course.desc}</p>
                
                <div className="flex items-center justify-between mt-auto">
                  <div className="flex gap-4">
                    <div className="flex items-center gap-2 text-[9px] md:text-[10px] text-gray-300 uppercase tracking-wider font-bold bg-black/40 px-3 py-1.5 rounded-lg backdrop-blur-md border border-white/5">
                      <FileText size={14} className="text-[#D4AF37]" /> {course.resources?.length || 0} Materials
                    </div>
                  </div>
                  <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-[#D4AF37] group-hover:text-black transition-colors backdrop-blur-md">
                    <ChevronRight size={16} />
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {previewResource && (
        <ResourcePreviewer resource={previewResource} onClose={() => setPreviewResource(null)} />
      )}
    </div>
  );
}

function StatCard({ title, value, valueSize = "text-5xl md:text-6xl", className="" }) {
  return (
    <div className={`glass p-6 md:p-8 rounded-[2rem] border-[#D4AF37]/10 relative overflow-hidden ${className}`}>
      <div className="absolute -right-4 -top-4 w-20 h-20 md:w-24 md:h-24 bg-[#D4AF37]/5 rounded-full blur-2xl"></div>
      <p className="text-gray-500 text-[8px] md:text-[9px] uppercase tracking-[0.2em] mb-4 font-bold">{title}</p>
      <h3 className={`serif ${valueSize} text-white`}>{value}</h3>
    </div>
  );
}

function CourseViewer({ course, user, onBack, onViewResource }) {
  const myAttendance = course.attendance?.filter(a => a.userId === user.uid) || [];
  const presentCount = myAttendance.filter(a => a.status === 'present').length;
  const totalLogs = myAttendance.length;
  const rate = totalLogs === 0 ? 0 : Math.round((presentCount / totalLogs) * 100);

  return (
    <div className="animate-in fade-in slide-in-from-right-8 duration-500">
      <button onClick={onBack} className="text-[#D4AF37] text-[9px] md:text-[10px] font-bold uppercase tracking-[0.2em] mb-6 md:mb-10 hover:text-white transition-colors flex items-center gap-2 relative z-10">
        <ChevronRight size={14} className="rotate-180" /> Return
      </button>

      <header className="mb-10 md:mb-16 relative rounded-[2rem] overflow-hidden glass border-[#D4AF37]/20 p-8 md:p-12">
        {course.coverImage && (
          <div className="absolute inset-0 z-0">
            <img src={course.coverImage} alt="Cover" className="w-full h-full object-cover opacity-30 mix-blend-overlay" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0a] via-[#0a0a0a]/90 to-transparent"></div>
          </div>
        )}
        <div className="relative z-10">
          <h1 className="serif text-4xl md:text-5xl lg:text-7xl mb-4 md:mb-6 text-white leading-tight">{course.title}</h1>
          <p className="text-gray-400 text-sm md:text-lg max-w-3xl leading-relaxed font-light">{course.desc}</p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 md:gap-10">
        <div className="lg:col-span-2 space-y-6 md:space-y-8">
          <h3 className="serif text-2xl md:text-3xl italic text-white flex items-center gap-4">
            <span className="w-6 md:w-8 h-[1px] bg-[#D4AF37]"></span> Curated Materials
          </h3>
          
          <div className="space-y-4">
            {(!course.resources || course.resources.length === 0) ? (
              <div className="glass p-8 md:p-10 rounded-3xl text-center text-gray-500 text-xs tracking-widest uppercase border-dashed border-white/5">
                No materials provided yet.
              </div>
            ) : (
              course.resources.map(r => (
                <button 
                  key={r.id}
                  onClick={() => onViewResource(r)}
                  className="w-full glass p-4 md:p-6 rounded-[1.5rem] flex items-center justify-between group hover:border-[#D4AF37]/40 transition-all text-left overflow-hidden relative"
                >
                  {/* Subtle video thumbnail background hint if available */}
                  {r.type === 'video' && r.thumbnailUrl && (
                    <div className="absolute inset-0 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity z-0 pointer-events-none">
                      <img src={r.thumbnailUrl} className="w-full h-full object-cover" />
                    </div>
                  )}

                  <div className="flex items-center gap-4 md:gap-6 pr-4 relative z-10">
                    <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-black/50 flex items-center justify-center text-[#D4AF37] shrink-0 group-hover:scale-110 transition-transform shadow-[0_0_15px_rgba(212,175,55,0.1)] border border-white/5">
                      {r.type === 'video' ? <PlayCircle size={20} className="md:w-6 md:h-6"/> : 
                       r.type === 'youtube' ? <PlayCircle size={20} className="md:w-6 md:h-6 text-red-500"/> : 
                       r.type === 'image' ? <ImageIcon size={20} className="md:w-6 md:h-6"/> : 
                       r.type === 'collage' ? <LayoutDashboard size={20} className="md:w-6 md:h-6"/> : 
                       r.type === 'text' ? <FileText size={20} className="md:w-6 md:h-6"/> : 
                       r.type === 'link' ? <LinkIcon size={20} className="md:w-6 md:h-6"/> : <FileText size={20} className="md:w-6 md:h-6"/>}
                    </div>
                    <div className="truncate">
                      <h4 className="text-white text-xs md:text-[13px] font-bold tracking-wider uppercase mb-1 truncate">{r.title}</h4>
                      <p className="text-gray-500 text-[8px] md:text-[9px] uppercase tracking-[0.2em] font-bold">{r.type} Resource</p>
                    </div>
                  </div>
                  <ChevronRight size={18} className="text-gray-600 group-hover:text-[#D4AF37] transition-colors shrink-0 relative z-10" />
                </button>
              ))
            )}
          </div>
        </div>

        <div className="space-y-6 md:space-y-8">
          <h3 className="serif text-2xl md:text-3xl italic text-white flex items-center gap-4">
            <span className="w-6 md:w-8 h-[1px] bg-[#D4AF37]"></span> Attendance Ledger
          </h3>
          <div className="glass p-6 md:p-8 rounded-[2rem] border-[#D4AF37]/20">
            <div className="text-center py-4 md:py-6 border-b border-white/5 mb-4 md:mb-6">
              <span className="text-5xl md:text-6xl serif text-[#D4AF37] block mb-2">{rate}%</span>
              <span className="text-[8px] md:text-[9px] text-gray-400 uppercase tracking-widest font-bold">Attendance Rate</span>
            </div>
            <div className="space-y-3 md:space-y-4 max-h-[250px] md:max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
              {myAttendance.length === 0 ? (
                <p className="text-center text-xs text-gray-600 tracking-widest uppercase py-4">No records.</p>
              ) : (
                myAttendance.sort((a,b) => new Date(b.markedAt || 0) - new Date(a.markedAt || 0)).map((log, idx) => {
                  const lecture = course.schedule?.find(s => s.id === log.scheduleId);
                  return (
                    <div key={idx} className="flex justify-between items-center bg-white/5 p-3 md:p-4 rounded-xl border border-white/5">
                      <div className="flex flex-col pr-2">
                         <span className="text-[9px] md:text-[10px] text-gray-300 tracking-widest font-bold mb-1 truncate">{lecture ? lecture.title : "Lecture Entry"}</span>
                         {lecture && <span className="text-[8px] text-gray-500 uppercase tracking-widest">{lecture.date}</span>}
                      </div>
                      <span className={`text-[8px] md:text-[9px] uppercase tracking-widest font-black px-2 md:px-3 py-1 rounded-md shrink-0 ${log.status === 'present' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                        {log.status}
                      </span>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </div>
        
        {/* Schedule Section */}
        <div className="lg:col-span-3 space-y-6 md:space-y-8 mt-4 md:mt-8">
          <h3 className="serif text-2xl md:text-3xl italic text-white flex items-center gap-4">
            <span className="w-6 md:w-8 h-[1px] bg-[#D4AF37]"></span> Course Schedule
          </h3>
          {(!course.schedule || course.schedule.length === 0) ? (
             <div className="glass p-8 rounded-3xl text-center text-gray-500 text-xs tracking-widest uppercase border-dashed border-white/5">
               Schedule not yet published.
             </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {course.schedule.sort((a,b) => new Date(a.date) - new Date(b.date)).map((s, i) => (
                <div key={s.id || i} className="glass p-6 md:p-8 rounded-[2rem] border-t-4 border-[#D4AF37] relative overflow-hidden group hover:bg-white/5 transition-colors">
                  <div className="absolute -right-4 -top-4 text-7xl serif text-white/5 font-bold pointer-events-none group-hover:scale-110 transition-transform">
                    {String(i + 1).padStart(2, '0')}
                  </div>
                  <p className="text-[#D4AF37] text-[10px] uppercase tracking-widest font-bold mb-3">{s.date}</p>
                  <h4 className="serif text-2xl text-white mb-2">{s.title}</h4>
                  <p className="text-gray-400 text-xs leading-relaxed font-light">{s.description}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Minimal & Powerful Resource Previewer
function ResourcePreviewer({ resource, onClose }) {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 md:p-6 bg-[#070707]/98 backdrop-blur-3xl animate-in fade-in duration-300">
      <div className="w-full max-w-6xl h-[90vh] md:h-[85vh] flex flex-col relative pt-12 md:pt-0">
        <button onClick={onClose} className="absolute top-0 right-0 md:-top-16 md:right-0 text-gray-400 hover:text-white transition-colors uppercase text-[10px] tracking-widest font-bold flex items-center gap-2 bg-black/50 md:bg-transparent p-2 md:p-0 rounded-lg z-50">
          <span className="hidden md:inline">Close Player</span> <X size={24} className="md:w-8 md:h-8" />
        </button>
        
        <div className="mb-4 md:mb-6 text-center px-4 relative z-10 shrink-0">
          <p className="text-[#D4AF37] text-[9px] md:text-[10px] uppercase tracking-[0.3em] font-bold mb-1 md:mb-2">{resource.type} Material</p>
          <h2 className="serif text-2xl md:text-4xl text-white italic truncate max-w-3xl mx-auto">{resource.title}</h2>
        </div>
        
        <div className="flex-1 glass rounded-2xl md:rounded-[2.5rem] overflow-hidden border border-[#D4AF37]/30 relative shadow-[0_0_50px_rgba(212,175,55,0.05)] bg-[#050505] flex items-center justify-center">
          
          {resource.type === 'youtube' && (
            <iframe 
              className="w-full h-full"
              src={getYoutubeEmbedUrl(resource.url)}
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            ></iframe>
          )}

          {resource.type === 'video' && (
            <video 
              className="w-full h-full max-h-full outline-none bg-black object-contain"
              controls
              controlsList="nodownload"
              poster={resource.thumbnailUrl || ''}
              playsInline
            >
              <source src={resource.url} />
              Your browser does not support the video tag.
            </video>
          )}

          {resource.type === 'pdf' && (
             <iframe src={`${resource.url}#toolbar=0`} className="w-full h-full bg-white rounded-b-[2rem]"></iframe>
          )}

          {resource.type === 'image' && (
            <div className="w-full h-full p-4 md:p-8 bg-[#0a0a0a] overflow-auto flex items-center justify-center">
               <img src={resource.url} alt={resource.title} className="max-w-full max-h-full object-contain rounded-xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-white/5" />
            </div>
          )}

          {resource.type === 'collage' && (
            <div className="w-full h-full p-6 md:p-10 overflow-y-auto custom-scrollbar bg-[#0a0a0a]">
               <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 auto-rows-[250px]">
                 {resource.url.split(',').map((imgUrl, i) => (
                   <div key={i} className={`rounded-[2rem] overflow-hidden border border-white/10 shadow-2xl hover:border-[#D4AF37]/50 transition-colors group ${i % 4 === 0 ? 'sm:col-span-2 sm:row-span-2' : ''}`}>
                     <img src={imgUrl.trim()} alt={`Collage ${i}`} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-in-out" />
                   </div>
                 ))}
               </div>
            </div>
          )}

          {resource.type === 'text' && (
            <div className="w-full h-full flex flex-col items-center p-6 md:p-16 overflow-y-auto custom-scrollbar bg-[#0a0a0a] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#D4AF37]/5 via-[#0a0a0a] to-[#0a0a0a]">
              <div className="max-w-3xl w-full">
                <FileText size={48} className="text-[#D4AF37]/20 mb-8 mx-auto" />
                <div className="prose prose-invert prose-gold max-w-none">
                  <p className="text-gray-300 whitespace-pre-wrap leading-loose font-light text-sm md:text-lg lg:text-xl font-sans text-justify">
                    {resource.url}
                  </p>
                </div>
              </div>
            </div>
          )}

          {resource.type === 'link' && (
            <div className="w-full h-full flex flex-col items-center justify-center p-6 md:p-10 text-center bg-[#0a0a0a]">
              <LinkIcon size={48} className="text-[#D4AF37] mb-6 md:w-16 md:h-16 animate-pulse" />
              <p className="text-gray-300 mb-8 max-w-md text-sm md:text-lg font-light leading-relaxed">This scholarly resource points to an external domain. Proceed to access the designated material.</p>
              <a href={resource.url} target="_blank" rel="noreferrer" className="bg-[#D4AF37] text-black px-10 md:px-12 py-4 md:py-5 rounded-xl text-[10px] md:text-[11px] font-bold uppercase tracking-[0.2em] hover:bg-[#F9E29D] hover:shadow-[0_0_30px_rgba(212,175,55,0.4)] transition-all">
                Access External Resource
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


// ==========================================
// TEACHER VIEWS & PUBLISHING
// ==========================================
function TeacherDashboard({ user, userData, courses, users }) {
  const [activeCourseId, setActiveCourseId] = useState(null);
  const [showResourceModal, setShowResourceModal] = useState(false);
  const [previewResource, setPreviewResource] = useState(null);

  const activeCourse = courses.find(c => c.id === activeCourseId);
  const taughtCourses = courses.filter(c => userData.enrolledCourses?.includes(c.id));

  const removeResource = async (resourceId) => {
    if(!confirm("Remove this resource permanently?")) return;
    const newResources = activeCourse.resources.filter(r => r.id !== resourceId);
    await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'courses', activeCourse.id), {
      resources: newResources
    });
    toast("Resource Removed");
  };

  if (activeCourse) {
    const enrolledStudents = users.filter(u => u.enrolledCourses?.includes(activeCourse.id) && u.roles.includes('student'));

    return (
      <div className="animate-in fade-in duration-500">
        <button onClick={() => setActiveCourseId(null)} className="text-[#D4AF37] text-[9px] md:text-[10px] font-bold uppercase tracking-[0.2em] mb-6 md:mb-10 hover:text-white transition-colors flex items-center gap-2">
          <ChevronRight size={14} className="rotate-180" /> Back to Dashboard
        </button>
        
        <header className="mb-8 md:mb-12 relative rounded-[2rem] overflow-hidden glass border-[#D4AF37]/20 p-8 md:p-12">
          {activeCourse.coverImage && (
            <div className="absolute inset-0 z-0">
              <img src={activeCourse.coverImage} alt="Cover" className="w-full h-full object-cover opacity-20 mix-blend-overlay" />
              <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0a] via-[#0a0a0a]/80 to-transparent"></div>
            </div>
          )}
          <div className="relative z-10">
            <h1 className="serif text-4xl md:text-5xl lg:text-6xl mb-4 text-white">Manage: <br className="md:hidden"/> {activeCourse.title}</h1>
            <p className="text-gray-400 text-xs md:text-sm max-w-2xl font-light">{activeCourse.desc}</p>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12">
          {/* Resource Management */}
          <div>
            <div className="flex items-center justify-between mb-6 md:mb-8">
               <h3 className="serif text-2xl md:text-3xl italic text-white flex items-center gap-3 md:gap-4">
                 <span className="w-4 md:w-6 h-[1px] bg-[#D4AF37]"></span> Syllabus Materials
               </h3>
               <button onClick={() => setShowResourceModal(true)} className="w-8 h-8 md:w-10 md:h-10 bg-[#D4AF37]/10 text-[#D4AF37] rounded-full flex items-center justify-center hover:bg-[#D4AF37] hover:text-black transition-all shadow-[0_0_15px_rgba(212,175,55,0.2)]">
                 <Plus size={18} />
               </button>
            </div>

            <div className="space-y-3 md:space-y-4">
               {(!activeCourse.resources || activeCourse.resources.length === 0) ? (
                 <div className="glass p-6 md:p-8 rounded-2xl text-center text-gray-500 text-[10px] md:text-xs tracking-widest uppercase border-dashed border-white/10">No materials published.</div>
               ) : (
                 activeCourse.resources.map(r => (
                   <div 
                     key={r.id} 
                     onClick={() => setPreviewResource(r)}
                     className="glass p-4 md:p-5 rounded-2xl flex items-center justify-between group border border-transparent hover:border-[#D4AF37]/40 transition-all cursor-pointer relative overflow-hidden"
                   >
                      {r.type === 'video' && r.thumbnailUrl && (
                        <div className="absolute inset-0 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity pointer-events-none">
                          <img src={r.thumbnailUrl} className="w-full h-full object-cover" />
                        </div>
                      )}

                      <div className="flex items-center gap-3 md:gap-4 pr-2 overflow-hidden relative z-10">
                        <div className="text-[#D4AF37] shrink-0 w-10 h-10 bg-black/50 rounded-xl flex items-center justify-center border border-white/5">
                          {r.type === 'video' ? <PlayCircle size={18} /> : r.type === 'youtube' ? <PlayCircle size={18} className="text-red-500"/> : r.type === 'link' ? <LinkIcon size={18}/> : r.type === 'collage' ? <LayoutDashboard size={18}/> : r.type === 'image' ? <ImageIcon size={18}/> : <FileText size={18}/>}
                        </div>
                        <div className="truncate">
                          <h4 className="text-white text-[10px] md:text-xs font-bold tracking-widest uppercase truncate mb-1">{r.title}</h4>
                          <span className="text-gray-500 text-[8px] md:text-[9px] uppercase tracking-widest">{r.type}</span>
                        </div>
                      </div>
                      <button onClick={(e) => { e.stopPropagation(); removeResource(r.id); }} className="text-gray-600 hover:text-red-500 p-2 rounded-lg hover:bg-red-500/10 transition-colors shrink-0 relative z-10">
                        <Trash2 size={14} className="md:w-4 md:h-4" />
                      </button>
                   </div>
                 ))
               )}
            </div>
          </div>

          {/* Student Roster Snapshot */}
          <div>
            <h3 className="serif text-2xl md:text-3xl italic text-white flex items-center gap-3 md:gap-4 mb-6 md:mb-8">
              <span className="w-4 md:w-6 h-[1px] bg-[#D4AF37]"></span> Enrolled Scholars
            </h3>
            <div className="glass p-4 md:p-6 rounded-[1.5rem] md:rounded-[2rem] border-[#D4AF37]/10">
               {enrolledStudents.length === 0 ? (
                 <p className="text-gray-500 text-center text-[10px] md:text-xs tracking-widest uppercase p-4 md:p-6">No students assigned.</p>
               ) : (
                 <div className="space-y-2 max-h-[300px] md:max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
                   {enrolledStudents.map(student => (
                     <div key={student.id} className="flex items-center gap-3 md:gap-4 p-3 md:p-4 rounded-xl bg-white/5 border border-white/5">
                        <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-gradient-to-br from-[#D4AF37] to-[#8B6508] flex items-center justify-center text-black serif font-bold text-base md:text-lg shrink-0">
                          {student.name.charAt(0)}
                        </div>
                        <div className="truncate">
                          <h4 className="text-white text-xs md:text-sm font-bold truncate">{student.name}</h4>
                          <p className="text-[8px] md:text-[9px] text-gray-400 tracking-[0.2em] uppercase">Student</p>
                        </div>
                     </div>
                   ))}
                 </div>
               )}
            </div>
          </div>
        </div>
        
        {showResourceModal && <ResourceCreatorModal courseId={activeCourse.id} onClose={() => setShowResourceModal(false)} />}
        {previewResource && <ResourcePreviewer resource={previewResource} onClose={() => setPreviewResource(null)} />}
      </div>
    );
  }

  return (
    <div className="animate-in fade-in duration-700">
      <header className="mb-10 md:mb-16">
        <h1 className="serif text-4xl md:text-5xl lg:text-7xl mb-4 text-white">Instructor <br className="md:hidden"/><span className="gold-gradient-text italic">Dashboard</span></h1>
        <p className="text-gray-400 text-[9px] md:text-[11px] tracking-[0.4em] uppercase font-bold flex items-center gap-2">
          Welcome, {userData.name}
        </p>
      </header>

      <div className="mb-8 md:mb-12">
        <h3 className="serif text-2xl md:text-3xl italic text-white">Your Assigned Tracks</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {taughtCourses.map(course => (
          <div key={course.id} className="glass p-6 md:p-8 rounded-[1.5rem] md:rounded-[2rem] border-[#D4AF37]/10 flex flex-col relative overflow-hidden group">
            {course.coverImage && (
              <div className="absolute inset-0 z-0 opacity-10 group-hover:opacity-20 transition-opacity duration-500">
                <img src={course.coverImage} className="w-full h-full object-cover" />
              </div>
            )}
            <div className="relative z-10 flex flex-col h-full">
              <h4 className="serif text-2xl md:text-3xl text-white mb-2">{course.title}</h4>
              <p className="text-gray-500 text-[9px] md:text-[10px] uppercase tracking-widest font-bold mb-4 md:mb-6 border-b border-white/10 pb-4">
                {course.resources?.length || 0} Materials
              </p>
              <button 
                onClick={() => setActiveCourseId(course.id)}
                className="mt-auto w-full py-3 md:py-4 bg-black/40 hover:bg-[#D4AF37] hover:text-black rounded-xl text-[9px] md:text-[10px] uppercase tracking-widest font-bold transition-all text-white border border-white/10 backdrop-blur-md"
              >
                Manage Syllabus
              </button>
            </div>
          </div>
        ))}
        {taughtCourses.length === 0 && (
          <p className="text-gray-500 text-xs md:text-sm tracking-widest uppercase col-span-full">No courses assigned to your profile.</p>
        )}
      </div>
    </div>
  );
}

function TeacherAttendance({ user, userData, courses, users }) {
  const taughtCourses = courses.filter(c => userData.enrolledCourses?.includes(c.id));
  
  const [selectedCourseId, setSelectedCourseId] = useState(null);
  const [selectedLectureId, setSelectedLectureId] = useState(null);

  const activeCourse = courses.find(c => c.id === selectedCourseId);
  const activeLecture = activeCourse?.schedule?.find(s => s.id === selectedLectureId);
  const enrolledStudents = activeCourse ? users.filter(u => u.enrolledCourses?.includes(activeCourse.id) && u.roles.includes('student')) : [];

  const markAttendance = async (studentId, status) => {
    try {
      // Remove any existing record for this specific student + lecture
      const existingRecords = activeCourse.attendance?.filter(a => !(a.userId === studentId && a.scheduleId === activeLecture.id)) || [];
      
      const newRecord = { 
        userId: studentId, 
        scheduleId: activeLecture.id, 
        status, 
        markedAt: new Date().toISOString() 
      };

      await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'courses', activeCourse.id), {
        attendance: [...existingRecords, newRecord]
      });
      toast(`Marked ${status}`);
    } catch(err) {
      toast("Error marking attendance");
    }
  };

  // State 3: Marking Attendance for a specific lecture
  if (activeLecture) {
    return (
      <div className="animate-in fade-in duration-500">
        <button onClick={() => setSelectedLectureId(null)} className="text-[#D4AF37] text-[9px] md:text-[10px] font-bold uppercase tracking-[0.2em] mb-6 md:mb-10 hover:text-white transition-colors flex items-center gap-2">
          <ChevronRight size={14} className="rotate-180" /> Back to Lectures
        </button>
        
        <header className="mb-10 md:mb-16">
          <div className="bg-[#D4AF37]/10 text-[#D4AF37] px-3 py-1.5 rounded-lg text-[8px] font-bold uppercase tracking-widest mb-4 inline-flex items-center gap-2">
             <Calendar size={12} /> {activeLecture.date}
          </div>
          <h1 className="serif text-4xl md:text-5xl lg:text-7xl mb-2 text-white">Lecture <span className="gold-gradient-text italic">Ledger</span></h1>
          <p className="text-gray-400 text-sm md:text-lg font-light">{activeLecture.title}</p>
        </header>

        <div className="glass p-5 md:p-8 rounded-[1.5rem] md:rounded-[2rem] border border-white/5">
          <h3 className="serif text-2xl md:text-3xl text-white mb-6 md:mb-8 border-b border-white/10 pb-3 md:pb-4">Student Roster</h3>
          
          {enrolledStudents.length === 0 ? (
            <p className="text-gray-500 text-[10px] md:text-xs tracking-widest uppercase">No scholars enrolled.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
              {enrolledStudents.map(student => {
                const markedRecord = activeCourse.attendance?.find(a => a.userId === student.id && a.scheduleId === activeLecture.id);
                
                return (
                  <div key={student.id} className="bg-black/40 p-4 md:p-5 rounded-[1rem] md:rounded-[1.5rem] flex items-center justify-between border border-white/5 shadow-lg">
                    <div className="truncate pr-2 md:pr-4 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#D4AF37] to-[#8B6508] flex items-center justify-center text-black serif font-bold text-sm shrink-0">
                        {student.name.charAt(0)}
                      </div>
                      <div>
                        <p className="text-white font-bold text-xs md:text-sm truncate">{student.name}</p>
                        <p className="text-gray-500 text-[8px] md:text-[9px] uppercase tracking-[0.2em] mt-0.5">Scholar</p>
                      </div>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <button 
                        onClick={() => markAttendance(student.id, 'present')}
                        className={`w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl flex items-center justify-center font-bold transition-all text-xs md:text-base ${markedRecord?.status === 'present' ? 'bg-green-500 text-black shadow-[0_0_15px_rgba(34,197,94,0.4)]' : 'bg-white/5 text-gray-400 hover:bg-green-500/20 hover:text-green-500'}`}
                      >
                        P
                      </button>
                      <button 
                        onClick={() => markAttendance(student.id, 'absent')}
                        className={`w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl flex items-center justify-center font-bold transition-all text-xs md:text-base ${markedRecord?.status === 'absent' ? 'bg-red-500 text-black shadow-[0_0_15px_rgba(239,68,68,0.4)]' : 'bg-white/5 text-gray-400 hover:bg-red-500/20 hover:text-red-500'}`}
                      >
                        A
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    );
  }

  // State 2: Selecting a Lecture from the Course Schedule
  if (activeCourse) {
    return (
      <div className="animate-in fade-in duration-500">
        <button onClick={() => setSelectedCourseId(null)} className="text-[#D4AF37] text-[9px] md:text-[10px] font-bold uppercase tracking-[0.2em] mb-6 md:mb-10 hover:text-white transition-colors flex items-center gap-2">
          <ChevronRight size={14} className="rotate-180" /> Back to Courses
        </button>

        <header className="mb-10 md:mb-16">
          <h1 className="serif text-4xl md:text-5xl lg:text-7xl mb-2 text-white">Select <span className="gold-gradient-text italic">Lecture</span></h1>
          <p className="text-gray-400 text-xs md:text-sm tracking-widest uppercase font-bold mt-4">{activeCourse.title}</p>
        </header>

        {(!activeCourse.schedule || activeCourse.schedule.length === 0) ? (
          <div className="glass p-8 md:p-12 rounded-[2rem] text-center text-gray-500 text-xs tracking-widest uppercase border-dashed border-white/10">
            No lectures scheduled for this track yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
             {activeCourse.schedule.sort((a,b) => new Date(a.date) - new Date(b.date)).map((s, idx) => (
               <button 
                 key={s.id}
                 onClick={() => setSelectedLectureId(s.id)}
                 className="glass p-6 md:p-8 rounded-[2rem] border-t-4 border-[#D4AF37] text-left hover:bg-white/5 transition-colors group relative overflow-hidden"
               >
                 <div className="absolute -right-4 -top-4 text-7xl serif text-white/5 font-bold pointer-events-none group-hover:scale-110 transition-transform">
                    {String(idx + 1).padStart(2, '0')}
                 </div>
                 <p className="text-[#D4AF37] text-[10px] uppercase tracking-widest font-bold mb-3 flex items-center gap-2"><Clock size={12}/> {s.date}</p>
                 <h4 className="serif text-2xl text-white mb-2 group-hover:text-[#D4AF37] transition-colors">{s.title}</h4>
                 <p className="text-gray-400 text-xs leading-relaxed font-light line-clamp-2">{s.description}</p>
               </button>
             ))}
          </div>
        )}
      </div>
    );
  }

  // State 1: Selecting a Course
  return (
    <div className="animate-in fade-in duration-500">
      <header className="mb-10 md:mb-16">
        <h1 className="serif text-4xl md:text-5xl lg:text-7xl mb-2 text-white">Attendance <span className="gold-gradient-text italic">Registry</span></h1>
        <p className="text-gray-400 text-xs md:text-sm font-light mt-4">Select a track to mark specific lecture attendance.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-8">
        {taughtCourses.map(c => (
          <button 
            key={c.id} 
            onClick={() => setSelectedCourseId(c.id)} 
            className="glass p-6 md:p-8 rounded-[1.5rem] md:rounded-[2.5rem] flex flex-col border border-transparent hover:border-[#D4AF37]/40 transition-all text-left relative overflow-hidden group min-h-[200px]"
          >
            {c.coverImage && (
              <div className="absolute inset-0 z-0 opacity-10 group-hover:opacity-20 transition-opacity duration-500 pointer-events-none">
                <img src={c.coverImage} className="w-full h-full object-cover" />
              </div>
            )}
            <div className="relative z-10 flex flex-col h-full w-full">
              <h3 className="serif text-2xl md:text-3xl text-white group-hover:text-[#D4AF37] transition-colors mb-4">{c.title}</h3>
              <div className="mt-auto flex items-center justify-between">
                 <span className="text-gray-500 text-[9px] uppercase tracking-widest font-bold bg-black/40 px-3 py-1.5 rounded-lg border border-white/5">
                   {c.schedule?.length || 0} Lectures
                 </span>
                 <ChevronRight size={18} className="text-[#D4AF37]" />
              </div>
            </div>
          </button>
        ))}
        {taughtCourses.length === 0 && (
           <p className="text-gray-500 text-xs md:text-sm tracking-widest uppercase col-span-full">No courses available for ledger entry.</p>
        )}
      </div>
    </div>
  );
}


// ==========================================
// ADVANCED RESOURCE CREATION MODAL
// ==========================================
function ResourceCreatorModal({ courseId, onClose }) {
  const [type, setType] = useState('pdf');
  const [inputMode, setInputMode] = useState('upload'); // 'upload' or 'url'
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  // File states
  const [singleFile, setSingleFile] = useState(null);
  const [multiFiles, setMultiFiles] = useState([]);
  const [thumbnailFile, setThumbnailFile] = useState(null);

  const allowsUpload = ['pdf', 'video', 'image', 'collage'].includes(type);

  useEffect(() => {
    if (!allowsUpload) {
      setInputMode('url');
    }
  }, [type, allowsUpload]);

  const uploadToStorage = (file, pathPrefix) => {
    return new Promise((resolve, reject) => {
      // Automatic image compression via Canvas to avoid Storage CORS completely
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
          const img = new Image();
          img.src = event.target.result;
          img.onload = () => {
            const canvas = document.createElement('canvas');
            const MAX = 1000;
            let { width, height } = img;
            if (width > height && width > MAX) { height *= MAX / width; width = MAX; }
            else if (height > MAX) { width *= MAX / height; height = MAX; }
            canvas.width = width;
            canvas.height = height;
            canvas.getContext('2d').drawImage(img, 0, 0, width, height);
            resolve(canvas.toDataURL('image/jpeg', 0.6));
          };
        };
        reader.onerror = () => reject(new Error("Failed to read image file"));
        return;
      }

      // Try Firebase storage for non-images (videos/pdf)
      try {
        const uniqueName = `${crypto.randomUUID()}_${file.name}`;
        // CRITICAL FIX: Ensure the path rigidly matches the public data structure rule
        const sRef = storageRef(storage, `artifacts/${appId}/public/data/${pathPrefix}_${uniqueName}`);
        const uploadTask = uploadBytesResumable(sRef, file);

        uploadTask.on('state_changed', 
          (snapshot) => {
            const prog = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            setProgress(Math.round(prog));
          }, 
          (error) => {
            console.error("Storage Error:", error);
            reject(new Error("Storage Error. Check permissions or file size limit."));
          }, 
          async () => {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            resolve(downloadURL);
          }
        );
      } catch (err) {
        reject(new Error("Storage Error. Please use 'External URL' mode."));
      }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setUploading(true);
    setProgress(0);
    const form = e.target;
    const title = form.title.value;
    
    try {
      let finalUrl = "";
      let finalThumbnailUrl = null;

      if (inputMode === 'upload' && allowsUpload) {
        if (type === 'collage') {
          if (multiFiles.length === 0) throw new Error("No files selected for collage.");
          const urls = await Promise.all(Array.from(multiFiles).map(f => uploadToStorage(f, 'collages')));
          finalUrl = urls.join(',');
        } else {
          if (!singleFile) throw new Error("No file selected.");
          finalUrl = await uploadToStorage(singleFile, type);
          
          if (type === 'video' && thumbnailFile) {
            finalThumbnailUrl = await uploadToStorage(thumbnailFile, 'thumbnails');
          }
        }
      } else {
        finalUrl = form.url.value;
      }

      await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'courses', courseId), {
        resources: arrayUnion({ 
          id: crypto.randomUUID(),
          type, 
          url: finalUrl, 
          thumbnailUrl: finalThumbnailUrl,
          title, 
          createdAt: new Date().toISOString()
        })
      });

      toast("Material Published");
      onClose();
    } catch(err) {
      console.error(err);
      toast(err.message || "Error publishing material");
    } finally {
      setUploading(false);
    }
  };

  const getAcceptType = () => {
    if (type === 'pdf') return 'application/pdf';
    if (type === 'video') return 'video/*';
    if (type === 'image' || type === 'collage') return 'image/*';
    return '*/*';
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#070707]/90 backdrop-blur-xl animate-in fade-in">
      <div className="glass p-6 md:p-10 rounded-[2rem] md:rounded-[3rem] w-full max-w-2xl border border-[#D4AF37]/30 shadow-2xl relative max-h-[90vh] overflow-y-auto custom-scrollbar">
        {!uploading && (
          <button onClick={onClose} className="absolute top-6 right-6 md:top-8 md:right-8 text-gray-500 hover:text-white text-2xl font-light">&times;</button>
        )}
        
        <h2 className="serif text-3xl md:text-4xl mb-2 text-white italic">Publish Material</h2>
        <p className="text-[#D4AF37] text-[9px] md:text-[10px] uppercase tracking-widest font-bold mb-8">Conservatory Repository Upload</p>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Resource Type Selector */}
          <div>
            <label className="text-[8px] md:text-[9px] text-gray-500 uppercase tracking-widest font-bold mb-3 block ml-2">Material Type</label>
            <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
              {['pdf', 'video', 'image', 'collage', 'youtube', 'text', 'link'].map(t => (
                <button 
                  key={t} type="button" onClick={() => setType(t)} disabled={uploading}
                  className={`px-4 py-2.5 rounded-xl text-[9px] uppercase tracking-widest font-bold whitespace-nowrap transition-all ${type === t ? 'bg-[#D4AF37] text-black shadow-[0_0_15px_rgba(212,175,55,0.4)]' : 'bg-black/50 text-gray-400 border border-white/10 hover:border-[#D4AF37]/50'}`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Title Input */}
          <div>
            <label className="text-[8px] md:text-[9px] text-gray-500 uppercase tracking-widest font-bold mb-2 block ml-2">Nomenclature</label>
            <input name="title" type="text" placeholder="e.g. Beethoven Sonata Opus 27" required disabled={uploading} className="w-full bg-black/50 border border-white/10 p-4 md:p-5 rounded-xl md:rounded-2xl text-[10px] md:text-[12px] tracking-widest uppercase outline-none focus:border-[#D4AF37] transition-all text-white placeholder:text-gray-600" />
          </div>

          {/* Upload vs URL Toggle (If allowed) */}
          {allowsUpload && (
            <div className="flex bg-black/50 p-1 rounded-xl border border-white/10 w-fit">
               <button type="button" disabled={uploading} onClick={() => setInputMode('upload')} className={`px-6 py-2 rounded-lg text-[9px] uppercase tracking-widest font-bold transition-all ${inputMode === 'upload' ? 'bg-[#D4AF37] text-black' : 'text-gray-500 hover:text-white'}`}>
                 <UploadCloud size={14} className="inline mr-2 mb-0.5" /> Upload File
               </button>
               <button type="button" disabled={uploading} onClick={() => setInputMode('url')} className={`px-6 py-2 rounded-lg text-[9px] uppercase tracking-widest font-bold transition-all ${inputMode === 'url' ? 'bg-[#D4AF37] text-black' : 'text-gray-500 hover:text-white'}`}>
                 <LinkIcon size={14} className="inline mr-2 mb-0.5" /> External URL
               </button>
            </div>
          )}

          {/* Content Input Area */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 md:p-6">
            {inputMode === 'upload' && allowsUpload ? (
              <div className="space-y-6">
                <div>
                  <label className="text-[8px] md:text-[9px] text-[#D4AF37] uppercase tracking-widest font-bold mb-3 block">
                    {type === 'collage' ? 'Select Multiple Files' : 'Select Source File'}
                  </label>
                  <div className="relative border-2 border-dashed border-white/20 rounded-2xl p-8 text-center hover:border-[#D4AF37]/50 transition-colors bg-black/30 group">
                    <input 
                      type="file" 
                      accept={getAcceptType()} 
                      multiple={type === 'collage'}
                      required 
                      disabled={uploading}
                      onChange={(e) => type === 'collage' ? setMultiFiles(e.target.files) : setSingleFile(e.target.files[0])}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
                    />
                    <FileIcon size={32} className="mx-auto text-gray-600 group-hover:text-[#D4AF37] mb-3 transition-colors" />
                    <p className="text-gray-300 text-xs font-bold uppercase tracking-widest mb-1">Drag & Drop or Click to Browse</p>
                    <p className="text-gray-500 text-[10px]">
                      {type === 'collage' 
                        ? (multiFiles.length > 0 ? `${multiFiles.length} files selected` : `Supported: Images (Multiple)`) 
                        : (singleFile ? singleFile.name : `Supported: ${type.toUpperCase()}`)}
                    </p>
                  </div>
                </div>

                {/* Optional Video Thumbnail */}
                {type === 'video' && (
                  <div className="pt-4 border-t border-white/10">
                    <label className="text-[8px] md:text-[9px] text-gray-400 uppercase tracking-widest font-bold mb-3 block flex items-center gap-2">
                      <ImagePlus size={12}/> Video Cover Thumbnail (Optional)
                    </label>
                    <input 
                      type="file" 
                      accept="image/*" 
                      disabled={uploading}
                      onChange={(e) => setThumbnailFile(e.target.files[0])}
                      className="w-full text-gray-400 text-xs"
                    />
                  </div>
                )}
              </div>
            ) : (
              <div>
                {type === 'text' ? (
                  <textarea name="url" placeholder="TYPE OR PASTE FULL TEXT CONTENT HERE..." required disabled={uploading} rows={8} className="w-full bg-black/50 border border-white/10 p-4 md:p-5 rounded-xl md:rounded-2xl text-sm outline-none focus:border-[#D4AF37] transition-all text-white placeholder:text-gray-600 font-light resize-none custom-scrollbar" />
                ) : type === 'collage' ? (
                  <textarea name="url" placeholder="COMMA SEPARATED IMAGE URLS" required disabled={uploading} rows={4} className="w-full bg-black/50 border border-white/10 p-4 md:p-5 rounded-xl md:rounded-2xl text-xs outline-none focus:border-[#D4AF37] transition-all text-white placeholder:text-gray-600 font-light resize-none" />
                ) : (
                  <input name="url" type="url" placeholder={type === 'youtube' ? "YOUTUBE URL (e.g. https://youtu.be/...)" : "DIRECT URL LINK"} required disabled={uploading} className="w-full bg-black/50 border border-white/10 p-4 md:p-5 rounded-xl md:rounded-2xl text-[10px] md:text-[12px] tracking-widest uppercase outline-none focus:border-[#D4AF37] transition-all text-white placeholder:text-gray-600" />
                )}
              </div>
            )}
          </div>
          
          {uploading && (
            <div className="w-full bg-white/5 rounded-full h-1.5 mb-4 overflow-hidden">
              <div className="bg-[#D4AF37] h-1.5 rounded-full transition-all duration-300" style={{ width: `${progress}%` }}></div>
              <p className="text-center text-[8px] text-[#D4AF37] mt-2 font-bold uppercase tracking-widest">Uploading {progress}%</p>
            </div>
          )}

          <div className="flex gap-3 md:gap-4 pt-4">
            <button type="button" onClick={onClose} disabled={uploading} className="flex-1 py-4 md:py-5 border border-white/10 rounded-xl md:rounded-2xl text-[9px] md:text-[10px] uppercase tracking-[0.2em] font-bold text-gray-400 hover:text-white transition-colors disabled:opacity-50">Cancel</button>
            <button type="submit" disabled={uploading} className="flex-1 bg-[#D4AF37] text-black rounded-xl md:rounded-2xl text-[9px] md:text-[10px] uppercase tracking-[0.2em] font-bold hover:bg-[#F9E29D] transition-colors shadow-lg flex items-center justify-center gap-2 disabled:opacity-50">
               {uploading ? <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin"></div> : <UploadCloud size={16} />}
               {uploading ? 'Processing' : 'Publish Asset'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}


// ==========================================
// ADMIN VIEWS (Users & Course Setup)
// ==========================================
function AdminUsers({ users, courses }) {
  const toggleRole = async (userId, userRoles, targetRole) => {
    try {
      let newRoles = [...userRoles];
      if (newRoles.includes(targetRole)) {
        newRoles = newRoles.filter(r => r !== targetRole);
      } else {
        newRoles.push(targetRole);
      }
      if (newRoles.length === 0) newRoles = ['student']; 

      await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'users', userId), { roles: newRoles });
      await updateDoc(doc(db, 'artifacts', appId, 'users', userId, 'profile', 'info'), { roles: newRoles });
      toast("Role Updated");
    } catch(err) {
      toast("Error updating role");
    }
  };

  const handleEnrollment = async (userId, userCourses, courseId) => {
    try {
      let updatedCourses = [...(userCourses || [])];
      if (updatedCourses.includes(courseId)) {
        updatedCourses = updatedCourses.filter(id => id !== courseId);
      } else {
        updatedCourses.push(courseId);
      }

      await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'users', userId), { enrolledCourses: updatedCourses });
      await updateDoc(doc(db, 'artifacts', appId, 'users', userId, 'profile', 'info'), { enrolledCourses: updatedCourses });
      toast("Enrollment Updated");
    } catch(err) {
      toast("Error updating enrollment");
    }
  };

  return (
    <div className="animate-in fade-in duration-500">
      <header className="mb-8 md:mb-12">
        <h1 className="serif text-4xl md:text-5xl lg:text-6xl mb-2 md:mb-4 text-white">User <span className="gold-gradient-text italic">Directory</span></h1>
        <p className="text-gray-400 text-xs md:text-sm font-light">Manage conservatory participants, roles, and course placements.</p>
      </header>

      <div className="space-y-4">
        {users.map(u => (
          <div key={u.id} className="glass p-5 md:p-8 rounded-[1.5rem] md:rounded-[2rem] flex flex-col md:flex-row md:items-center justify-between gap-5 md:gap-6 border border-white/5">
            
            <div className="flex items-center gap-4 md:gap-6">
              <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-gradient-to-br from-gray-800 to-black border border-white/10 flex items-center justify-center text-white serif text-xl md:text-2xl shadow-inner shrink-0">
                {u.name.charAt(0)}
              </div>
              <div className="overflow-hidden">
                <h4 className="text-lg md:text-xl font-bold text-white mb-1 truncate">{u.name}</h4>
                <div className="flex flex-wrap gap-2">
                  {u.roles?.map(r => (
                    <span key={r} className="text-[7px] md:text-[8px] bg-[#D4AF37]/10 text-[#D4AF37] px-2 py-1 rounded uppercase tracking-widest font-bold">
                      {r}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row md:flex-row gap-3 md:gap-4 items-stretch md:items-center w-full md:w-auto mt-2 md:mt-0">
              <div className="flex bg-black/50 p-1 rounded-xl border border-white/5 w-full md:w-auto">
                {['student', 'teacher', 'admin'].map(r => (
                   <button 
                     key={r}
                     onClick={() => toggleRole(u.id, u.roles || [], r)}
                     className={`flex-1 md:flex-none px-3 md:px-4 py-2 text-[8px] md:text-[9px] uppercase tracking-widest font-bold rounded-lg transition-all ${u.roles?.includes(r) ? 'bg-[#D4AF37] text-black' : 'text-gray-500 hover:text-white'}`}
                   >
                     {r.substring(0,3)}
                   </button>
                ))}
              </div>

              <div className="relative group w-full sm:w-auto">
                <button className="w-full bg-white/5 border border-white/10 px-4 md:px-6 py-2.5 md:py-3 rounded-xl text-[9px] md:text-[10px] uppercase tracking-widest font-bold text-gray-300 hover:text-white hover:border-white/30 transition-all">
                  Placements
                </button>
                <div className="absolute right-0 top-full mt-2 w-full sm:w-56 md:w-64 glass p-3 md:p-4 rounded-xl md:rounded-2xl border border-white/10 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-all z-20 max-h-48 md:max-h-64 overflow-y-auto shadow-2xl custom-scrollbar">
                   <p className="text-[7px] md:text-[8px] text-gray-500 uppercase tracking-widest font-bold mb-2 md:mb-3 border-b border-white/10 pb-2">Available Tracks</p>
                   {courses.length === 0 ? <p className="text-[9px] md:text-[10px] text-gray-400">No courses exist.</p> : courses.map(c => {
                     const isEnrolled = u.enrolledCourses?.includes(c.id);
                     return (
                       <label key={c.id} className="flex items-center gap-2 md:gap-3 p-2 hover:bg-white/5 rounded-lg cursor-pointer">
                         <input 
                           type="checkbox" 
                           checked={isEnrolled}
                           onChange={() => handleEnrollment(u.id, u.enrolledCourses, c.id)}
                           className="accent-[#D4AF37] w-3 h-3 md:w-4 md:h-4 rounded"
                         />
                         <span className="text-[10px] md:text-xs text-white truncate font-light">{c.title}</span>
                       </label>
                     )
                   })}
                </div>
              </div>
            </div>

          </div>
        ))}
      </div>
    </div>
  );
}

function AdminCourses({ courses }) {
  const [showModal, setShowModal] = useState(false);
  const [managingCourseId, setManagingCourseId] = useState(null);

  const managingCourse = courses.find(c => c.id === managingCourseId);

  const createCourse = async (e) => {
    e.preventDefault();
    const form = e.target;
    const title = form.title.value;
    const desc = form.desc.value;
    const coverImage = form.coverImage.value;

    try {
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'courses'), {
        title,
        desc,
        coverImage,
        resources: [],
        attendance: [],
        schedule: [],
        createdAt: new Date().toISOString()
      });
      toast("Track Initiated");
      setShowModal(false);
      form.reset();
    } catch(err) {
      toast("Error creating course");
    }
  };

  const deleteCourseRecord = async (id, e) => {
    e.stopPropagation();
    if(!confirm("Permanently delete this course? This action is irreversible.")) return;
    try {
      await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'courses', id));
      toast("Course Purged");
    } catch(err) {
      toast("Error deleting");
    }
  };

  if (managingCourse) {
    return <AdminCourseEditor course={managingCourse} onBack={() => setManagingCourseId(null)} />;
  }

  return (
    <div className="animate-in fade-in duration-500 relative min-h-full">
      <header className="flex flex-col md:flex-row md:justify-between md:items-end gap-4 md:gap-6 mb-8 md:mb-12">
        <div>
          <h1 className="serif text-4xl md:text-5xl lg:text-6xl mb-2 md:mb-4 text-white">Course <span className="gold-gradient-text italic">Registry</span></h1>
          <p className="text-gray-400 text-xs md:text-sm font-light">Establish and manage the conservatory's offerings.</p>
        </div>
        <button onClick={() => setShowModal(true)} className="bg-[#D4AF37] text-black px-6 md:px-8 py-3 md:py-4 rounded-xl text-[10px] md:text-[11px] font-bold uppercase tracking-[0.2em] hover:bg-[#F9E29D] transition-colors flex items-center justify-center gap-2 shrink-0 shadow-[0_0_20px_rgba(212,175,55,0.2)]">
          <Plus size={16} /> New Track
        </button>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-8">
        {courses.map(c => (
          <div key={c.id} onClick={() => setManagingCourseId(c.id)} className="glass p-6 md:p-8 rounded-[1.5rem] md:rounded-[2.5rem] flex flex-col border border-transparent hover:border-[#D4AF37]/40 transition-all cursor-pointer group shadow-lg hover:shadow-[0_0_30px_rgba(212,175,55,0.1)] relative overflow-hidden min-h-[300px]">
            {c.coverImage && (
              <div className="absolute inset-0 z-0 opacity-20 group-hover:opacity-40 transition-opacity duration-500">
                <img src={c.coverImage} alt={c.title} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/80 to-[#0a0a0a]/20"></div>
              </div>
            )}
            <div className="relative z-10 flex flex-col h-full">
              <div className="flex justify-between items-start mb-3 md:mb-4">
                <h3 className="serif text-2xl md:text-3xl text-white group-hover:text-[#D4AF37] transition-colors pr-4">{c.title}</h3>
                <button onClick={(e) => deleteCourseRecord(c.id, e)} className="w-8 h-8 rounded-full bg-black/40 flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-500/20 transition-colors shrink-0 backdrop-blur-md">
                  <Trash2 size={14} />
                </button>
              </div>
              <p className="text-gray-300 text-xs md:text-sm mb-6 md:mb-8 line-clamp-3 font-light leading-relaxed">{c.desc}</p>
              
              <div className="mt-auto pt-4 md:pt-6 border-t border-white/10 flex items-center justify-between text-[#D4AF37] text-[9px] md:text-[10px] uppercase tracking-widest font-bold">
                 <span className="bg-black/40 px-3 py-1.5 rounded-lg backdrop-blur-md">{c.resources?.length || 0} Assets</span>
                 <span className="bg-black/40 px-3 py-1.5 rounded-lg backdrop-blur-md">{c.schedule?.length || 0} Lectures</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#070707]/90 backdrop-blur-md animate-in fade-in">
          <div className="glass p-6 md:p-10 rounded-[2rem] md:rounded-[3rem] w-full max-w-xl border border-[#D4AF37]/30 shadow-2xl relative">
            <button onClick={() => setShowModal(false)} className="absolute top-6 right-6 md:top-8 md:right-8 text-gray-500 hover:text-white text-xl md:text-2xl font-light">&times;</button>
            
            <h2 className="serif text-3xl md:text-4xl mb-1 md:mb-2 text-white italic">Initialize Track</h2>
            <p className="text-[#D4AF37] text-[9px] md:text-[10px] uppercase tracking-widest font-bold mb-6 md:mb-10">Add to Conservatory Registry</p>
            
            <form onSubmit={createCourse} className="space-y-4 md:space-y-6">
              <div>
                <input name="title" type="text" placeholder="COURSE NOMENCLATURE" required className="w-full bg-black/50 border border-white/10 p-4 md:p-5 rounded-xl md:rounded-2xl text-[10px] md:text-[12px] tracking-widest uppercase outline-none focus:border-[#D4AF37] transition-all text-white placeholder:text-gray-600" />
              </div>
              <div>
                <input name="coverImage" type="url" placeholder="COVER IMAGE URL (OPTIONAL)" className="w-full bg-black/50 border border-white/10 p-4 md:p-5 rounded-xl md:rounded-2xl text-[10px] md:text-[12px] tracking-widest uppercase outline-none focus:border-[#D4AF37] transition-all text-white placeholder:text-gray-600" />
              </div>
              <div>
                <textarea name="desc" placeholder="SYLLABUS DESCRIPTION" required rows={4} className="w-full bg-black/50 border border-white/10 p-4 md:p-5 rounded-xl md:rounded-2xl text-xs md:text-sm outline-none focus:border-[#D4AF37] transition-all text-white placeholder:text-gray-600 resize-none font-light leading-relaxed custom-scrollbar" />
              </div>
              
              <div className="flex gap-3 md:gap-4 pt-2 md:pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-4 md:py-5 border border-white/10 rounded-xl md:rounded-2xl text-[9px] md:text-[10px] uppercase tracking-[0.2em] font-bold text-gray-400 hover:text-white transition-colors">
                  Cancel
                </button>
                <button type="submit" className="flex-1 bg-[#D4AF37] text-black rounded-xl md:rounded-2xl text-[9px] md:text-[10px] uppercase tracking-[0.2em] font-bold hover:bg-[#F9E29D] transition-colors shadow-lg">
                  Establish
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function AdminCourseEditor({ course, onBack }) {
  const [showResourceModal, setShowResourceModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [previewResource, setPreviewResource] = useState(null);

  const removeResource = async (resourceId) => {
    if(!confirm("Remove this resource permanently?")) return;
    const newResources = course.resources.filter(r => r.id !== resourceId);
    await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'courses', course.id), {
      resources: newResources
    });
    toast("Resource Removed");
  };

  const removeSchedule = async (scheduleId) => {
    if(!confirm("Remove this lecture schedule?")) return;
    const newSchedule = (course.schedule || []).filter(s => s.id !== scheduleId);
    await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'courses', course.id), {
      schedule: newSchedule
    });
    toast("Schedule Removed");
  };

  return (
    <div className="animate-in fade-in slide-in-from-right-8 duration-500">
      <button onClick={onBack} className="text-[#D4AF37] text-[9px] md:text-[10px] font-bold uppercase tracking-[0.2em] mb-6 md:mb-10 hover:text-white transition-colors flex items-center gap-2 relative z-10">
        <ChevronRight size={14} className="rotate-180" /> Back to Registry
      </button>

      <header className="mb-10 md:mb-16 relative rounded-[2rem] overflow-hidden glass border-[#D4AF37]/20 p-8 md:p-12">
        {course.coverImage && (
          <div className="absolute inset-0 z-0">
            <img src={course.coverImage} alt="Cover" className="w-full h-full object-cover opacity-20 mix-blend-overlay" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0a] via-[#0a0a0a]/80 to-transparent"></div>
          </div>
        )}
        <div className="relative z-10">
          <span className="bg-[#D4AF37] text-black px-3 py-1 rounded text-[8px] font-bold uppercase tracking-widest mb-4 inline-block">Management Mode</span>
          <h1 className="serif text-4xl md:text-5xl lg:text-6xl mb-4 text-white leading-tight">{course.title}</h1>
          <p className="text-gray-400 text-sm max-w-3xl leading-relaxed font-light">{course.desc}</p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12">
        {/* SCHEDULE MANAGEMENT */}
        <div className="space-y-6 md:space-y-8">
          <div className="flex items-center justify-between">
            <h3 className="serif text-2xl md:text-3xl italic text-white flex items-center gap-4">
              <span className="w-6 md:w-8 h-[1px] bg-[#D4AF37]"></span> Lecture Schedule
            </h3>
            <button onClick={() => setShowScheduleModal(true)} className="w-10 h-10 bg-[#D4AF37]/10 text-[#D4AF37] rounded-full flex items-center justify-center hover:bg-[#D4AF37] hover:text-black transition-all shadow-lg">
              <Plus size={20} />
            </button>
          </div>
          
          <div className="space-y-4">
            {(!course.schedule || course.schedule.length === 0) ? (
              <div className="glass p-8 rounded-[1.5rem] text-center text-gray-500 text-[10px] tracking-widest uppercase border-dashed border-white/10">No schedule created.</div>
            ) : (
              course.schedule.sort((a,b) => new Date(a.date) - new Date(b.date)).map((s, idx) => (
                <div key={s.id} className="glass p-6 rounded-[1.5rem] border-l-4 border-[#D4AF37] relative group">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="text-[#D4AF37] text-[9px] uppercase tracking-widest font-bold mb-1">Lecture {idx + 1} • {s.date}</p>
                      <h4 className="serif text-xl text-white">{s.title}</h4>
                    </div>
                    <button onClick={() => removeSchedule(s.id)} className="text-gray-600 hover:text-red-500 p-2 rounded-lg hover:bg-red-500/10 transition-colors shrink-0">
                      <Trash2 size={16} />
                    </button>
                  </div>
                  <p className="text-gray-400 text-xs leading-relaxed font-light">{s.description}</p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* RESOURCE MANAGEMENT */}
        <div className="space-y-6 md:space-y-8">
          <div className="flex items-center justify-between">
            <h3 className="serif text-2xl md:text-3xl italic text-white flex items-center gap-4">
              <span className="w-6 md:w-8 h-[1px] bg-[#D4AF37]"></span> Notes & Resources
            </h3>
            <button onClick={() => setShowResourceModal(true)} className="w-10 h-10 bg-[#D4AF37]/10 text-[#D4AF37] rounded-full flex items-center justify-center hover:bg-[#D4AF37] hover:text-black transition-all shadow-lg">
              <Plus size={20} />
            </button>
          </div>

          <div className="space-y-4">
            {(!course.resources || course.resources.length === 0) ? (
              <div className="glass p-8 rounded-[1.5rem] text-center text-gray-500 text-[10px] tracking-widest uppercase border-dashed border-white/10">No materials published.</div>
            ) : (
              course.resources.map(r => (
                <div 
                  key={r.id} 
                  onClick={() => setPreviewResource(r)}
                  className="glass p-5 rounded-[1.5rem] flex items-center justify-between group hover:border-[#D4AF37]/30 transition-all border border-white/5 relative overflow-hidden cursor-pointer"
                >
                  
                  {r.type === 'video' && r.thumbnailUrl && (
                    <div className="absolute inset-0 opacity-10 group-hover:opacity-20 transition-opacity pointer-events-none">
                      <img src={r.thumbnailUrl} className="w-full h-full object-cover" />
                    </div>
                  )}

                  <div className="flex items-center gap-4 pr-2 overflow-hidden relative z-10">
                    <div className="w-12 h-12 rounded-xl bg-black/40 flex items-center justify-center text-[#D4AF37] shrink-0 border border-white/5">
                      {r.type === 'video' ? <PlayCircle size={18}/> : 
                       r.type === 'youtube' ? <PlayCircle size={18} className="text-red-500"/> : 
                       r.type === 'image' ? <ImageIcon size={18}/> : 
                       r.type === 'collage' ? <LayoutDashboard size={18}/> : 
                       r.type === 'text' ? <FileText size={18}/> : <LinkIcon size={18}/>}
                    </div>
                    <div className="truncate">
                      <h4 className="text-white text-sm font-bold tracking-wider uppercase mb-1 truncate">{r.title}</h4>
                      <span className="text-gray-500 text-[8px] uppercase tracking-widest font-bold">{r.type}</span>
                    </div>
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); removeResource(r.id); }} className="text-gray-600 hover:text-red-500 p-3 rounded-xl hover:bg-red-500/10 transition-colors shrink-0 relative z-10">
                    <Trash2 size={16} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {showResourceModal && <ResourceCreatorModal courseId={course.id} onClose={() => setShowResourceModal(false)} />}
      {showScheduleModal && <ScheduleCreatorModal courseId={course.id} onClose={() => setShowScheduleModal(false)} />}
      {previewResource && <ResourcePreviewer resource={previewResource} onClose={() => setPreviewResource(null)} />}
    </div>
  );
}

function ScheduleCreatorModal({ courseId, onClose }) {
  const handleSubmit = async (e) => {
    e.preventDefault();
    const form = e.target;
    const scheduleItem = {
      id: crypto.randomUUID(),
      date: form.date.value,
      title: form.title.value,
      description: form.desc.value
    };

    try {
      await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'courses', courseId), {
        schedule: arrayUnion(scheduleItem)
      });
      toast("Lecture Scheduled");
      onClose();
    } catch(err) {
      toast("Error scheduling lecture");
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#070707]/90 backdrop-blur-md animate-in fade-in">
      <div className="glass p-8 md:p-12 rounded-[2rem] md:rounded-[3rem] w-full max-w-xl border border-[#D4AF37]/30 shadow-2xl relative">
        <button onClick={onClose} className="absolute top-6 right-6 md:top-8 md:right-8 text-gray-500 hover:text-white text-2xl font-light">&times;</button>
        
        <h2 className="serif text-3xl md:text-4xl mb-2 text-white italic">Schedule Lecture</h2>
        <p className="text-[#D4AF37] text-[9px] md:text-[10px] uppercase tracking-widest font-bold mb-8">Add to Course Itinerary</p>
        
        <form onSubmit={handleSubmit} className="space-y-5 md:space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6">
             <div>
               <label className="text-[8px] md:text-[9px] text-gray-500 uppercase tracking-widest font-bold mb-2 block ml-2">Lecture Date</label>
               <input name="date" type="date" required className="w-full bg-black/50 border border-white/10 p-4 md:p-5 rounded-xl md:rounded-2xl text-[10px] md:text-[12px] tracking-widest uppercase outline-none focus:border-[#D4AF37] transition-all text-white" />
             </div>
             <div>
               <label className="text-[8px] md:text-[9px] text-gray-500 uppercase tracking-widest font-bold mb-2 block ml-2">Lecture Title</label>
               <input name="title" type="text" placeholder="e.g. Masterclass on Scales" required className="w-full bg-black/50 border border-white/10 p-4 md:p-5 rounded-xl md:rounded-2xl text-[10px] md:text-[12px] tracking-widest uppercase outline-none focus:border-[#D4AF37] transition-all text-white placeholder:text-gray-600" />
             </div>
          </div>

          <div>
            <textarea name="desc" placeholder="BRIEF LECTURE DESCRIPTION OR AGENDA" required rows={3} className="w-full bg-black/50 border border-white/10 p-4 md:p-5 rounded-xl md:rounded-2xl text-xs outline-none focus:border-[#D4AF37] transition-all text-white placeholder:text-gray-600 font-light resize-none custom-scrollbar" />
          </div>
          
          <div className="flex gap-4 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-4 md:py-5 border border-white/10 rounded-xl md:rounded-2xl text-[9px] md:text-[10px] uppercase tracking-[0.2em] font-bold text-gray-400 hover:text-white transition-colors">Cancel</button>
            <button type="submit" className="flex-1 bg-[#D4AF37] text-black rounded-xl md:rounded-2xl text-[9px] md:text-[10px] uppercase tracking-[0.2em] font-bold hover:bg-[#F9E29D] transition-colors shadow-lg">Schedule</button>
          </div>
        </form>
      </div>
    </div>
  );
}
