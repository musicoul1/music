import React, { useState, useEffect, useRef } from "react";
import { initializeApp } from "firebase/app";
import { 
    getAuth, 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword,
    onAuthStateChanged,
    signOut,
    updateProfile
} from "firebase/auth";
import { getFirestore, collection, addDoc, onSnapshot, doc, deleteDoc, setDoc, getDoc, getDocs } from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";


// --- Firebase Configuration ---
const firebaseConfig = {
    apiKey: "AIzaSyBaDBLoe2Wi2WgmJfPRXoEP-ZSgkVhMxVI",
    authDomain: "musicoul-15025.firebaseapp.com",
    databaseURL: "https://musicoul-15025-default-rtdb.firebaseio.com",
    projectId: "musicoul-15025",
    storageBucket: "musicoul-15025.appspot.com",
    messagingSenderId: "863099041367",
    appId: "1:863099041367:web:c3d61399489a219611d512",
    measurementId: "G-WBPE697N9Q"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// --- Static Data & Constants ---
const ADMIN_EMAIL = "chandrashekharkolhe7@gmail.com";

const NAV_ITEMS = [
    { name: "Home", id: "home" },
    { name: "Courses", id: "courses" },
    { name: "Teachers", id: "teachers" },
    { name: "About", id: "about" },
    { name: "Contact", id: "contact" },
];

const STATIC_COURSES_DATA = [
    { id: 'static_singing', subject: "Singing", level: "All Levels", description: "Master vocal techniques from seasoned professionals.", imageUrl: "https://img.freepik.com/premium-photo/young-man-singer-stag_5850-338.jpg" },
    { id: 'static_piano', subject: "Piano", level: "All Levels", description: "Learn piano theory, technique, and performance.", imageUrl: "https://media.istockphoto.com/id/1129332575/photo/favorite-classical-music-close-up-view-of-gentle-female-hands-playing-a-melody-on-piano-while.jpg?s=612x612&w=0&k=20&c=GJEJTdGtmgHpKjDL7BE9KO2diJNQ4lPinInWiJAOSCQ=" },
    { id: 'static_tabla', subject: "Tabla", level: "All Levels", description: "Explore Indian classical rhythms with our tabla masters.", imageUrl: "https://jagatsinghhotels.com/media/jsHotel/Experiences/2.jpg" }
];

const TEACHERS_DATA = [
    { id: 'teacher1', name: "Chandrashekhar Kolhe", subjects: "Singing, Tabla", experience: "7+ Years", img: "https://encrypted-tbn2.gstatic.com/images?q=tbn:ANd9GcRaCNhiok5D6DbyD9yMS5tuOb5jSJnm-sHmGvsZhAMia2_QcUhz" },
    { id: 'teacher2', name: "Ganesh Wagh", subjects: "Tabla, Percussions", experience: "7+ Years", img: "https://c.superprof.com/i/a/28810301/12782620/600/20250501060151/unlock-the-rhythms-indian-classical-music-tabla-classes-online-offline-start-your-musical-journey-now.jpg" },
    { id: 'teacher3', name: "Hariom Kolhe", subjects: "Singing, Tabla", experience: "4+ Years", img: "https://i.ibb.co/sK63c1K/504491719-18064378967139468-1007831381806455758-n.jpg" }
];

const FEATURES_DATA = [
    { icon: "🎵", title: "Live Interactive Classes", desc: "Engage in real-time with expert instructors and fellow students for a dynamic learning experience." },
    { icon: "📜", title: "Structured Syllabus", desc: "Follow a clear, progressive path from beginner to advanced levels with our well-defined curriculum." },
    { icon: "👩‍🏫", title: "Expert Teachers", desc: "Learn from professional musicians and passionate educators with years of teaching experience." },
];


// --- Reusable Components ---

const TypewriterText = ({ words, typingSpeed = 100, deletingSpeed = 50, pause = 1400 }) => {
    const [wordIndex, setWordIndex] = useState(0);
    const [subIndex, setSubIndex] = useState(0);
    const [isDeleting, setIsDeleting] = useState(false);
    const [blink, setBlink] = useState(true);

    useEffect(() => {
        const blinker = setInterval(() => setBlink(prev => !prev), 500);
        return () => clearInterval(blinker);
    }, []);

    useEffect(() => {
        const currentWord = words[wordIndex];
        let timeout;

        if (isDeleting) {
            if (subIndex > 0) {
                timeout = setTimeout(() => setSubIndex(prev => prev - 1), deletingSpeed);
            } else {
                setIsDeleting(false);
                setWordIndex((prev) => (prev + 1) % words.length);
            }
        } else {
            if (subIndex < currentWord.length) {
                timeout = setTimeout(() => setSubIndex(prev => prev + 1), typingSpeed);
            } else {
                timeout = setTimeout(() => setIsDeleting(true), pause);
            }
        }

        return () => clearTimeout(timeout);
    }, [subIndex, isDeleting, wordIndex, words, typingSpeed, deletingSpeed, pause]);

    return (
        <span className="bg-gradient-to-r from-purple-600 via-red-500 to-pink-500 bg-clip-text text-transparent">
            {words[wordIndex].substring(0, subIndex)}
            <span className="ml-1 text-white">{blink ? '|' : ' '}</span>
        </span>
    );
};

const Header = ({ navItems, onNavItemClick, onLoginClick, onSignupClick, currentUser, onLogout, onAdminClick, hasAssignedCourses }) => {
    const [menuOpen, setMenuOpen] = useState(false);

    const handleMobileLinkClick = (id) => {
        onNavItemClick(id);
        setMenuOpen(false);
    };

    const isUserAnonymous = currentUser?.isAnonymous;

    return (
        <header className="bg-black/90 sticky top-0 z-50 border-b border-gray-800">
            <div className="max-w-7xl mx-auto px-6 py-4 flex items-center">
                <div className="flex items-center gap-4 z-10">
                    <img src="https://yt3.googleusercontent.com/FRE-Mlxh3eYM2VObB1ZHR4zygMMjAAZfuoLbeBMtVHfzjlqs2RkozmqNDQ8_iEhESwA5J_zxAA=s160-c-k-c0x00ffffff-no-rj" alt="Musicoul Logo" className="w-12 h-12 rounded-full" />
                    <div className="heading text-white text-2xl font-bold">Musicoul</div>
                </div>

                <nav className="hidden md:flex gap-8 text-sm font-medium text-gray-300 items-center ml-auto">
                    {navItems.map(item => (
                        <button key={item.name} onClick={() => onNavItemClick(item.id)} className="hover:text-pink-400 bodyfont transition-colors duration-300">{item.name}</button>
                    ))}
                    {hasAssignedCourses && (<button onClick={() => onNavItemClick('myClass')} className="hover:text-pink-400 bodyfont transition-colors duration-300 font-bold">My Class</button>)}
                    {currentUser?.email === ADMIN_EMAIL && (
                        <button onClick={onAdminClick} className="hover:text-pink-400 bodyfont transition-colors duration-300 font-bold">Admin Panel</button>
                    )}
                    <div className="flex gap-3 ml-4 items-center">
                        {currentUser && !isUserAnonymous ? (
                            <>
                                <span className="text-sm text-gray-300 bodyfont">Hi, {currentUser.displayName ? currentUser.displayName.split(' ')[0] : currentUser.email.split('@')[0]}</span>
                                <button className="heading font-semibold text-white border-2 border-purple-700 rounded-md px-4 py-2 transition-all duration-300 hover:bg-purple-700 hover:scale-105" onClick={onLogout}>Logout</button>
                            </>
                        ) : (
                            <>
                                <button className="cta text-white px-4 py-2 rounded-md heading font-semibold" onClick={onLoginClick}>Login</button>
                                <button className="heading font-semibold text-white border-2 border-purple-700 rounded-md px-4 py-2 transition-all duration-300 hover:bg-purple-700 hover:scale-105" onClick={onSignupClick}>Signup</button>
                            </>
                        )}
                    </div>
                </nav>

                <button className="md:hidden p-2 border rounded-lg border-gray-600 text-gray-300 z-50 ml-auto" onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle navigation menu" >
                    {menuOpen ? '✕' : '☰'}
                </button>
            </div>

            <div className={`md:hidden bg-black border-t border-gray-800 flex flex-col items-center overflow-hidden transition-all duration-500 ease-in-out ${menuOpen ? 'max-h-96 opacity-100 py-4' : 'max-h-0'}`}>
                {navItems.map(item => (<button key={item.name} onClick={() => handleMobileLinkClick(item.id)} className="py-3 text-gray-200 hover:text-pink-400 heading">{item.name}</button>))}
                {hasAssignedCourses && (<button onClick={() => { onNavItemClick('myClass'); setMenuOpen(false); }} className="py-3 text-gray-200 hover:text-pink-400 heading font-bold">My Class</button>)}
                {currentUser?.email === ADMIN_EMAIL && (<button onClick={() => { onAdminClick(); setMenuOpen(false); }} className="py-3 text-gray-200 hover:text-pink-400 heading font-bold">Admin Panel</button>)}
                <div className="flex gap-4 mt-3">
                     {currentUser && !isUserAnonymous ? ( <button className="heading font-semibold text-white text-sm border-2 border-purple-700 rounded-md px-4 py-2 transition-all duration-300 hover:bg-purple-700 hover:scale-105" onClick={onLogout}>Logout</button> ) : ( <> <button className="cta text-white text-sm px-4 py-2 rounded-md heading font-semibold" onClick={onLoginClick}>Login</button> <button className="heading font-semibold text-white text-sm border-2 border-purple-700 rounded-md px-4 py-2 transition-all duration-300 hover:bg-purple-700 hover:scale-105" onClick={onSignupClick}>Signup</button> </> )}
                </div>
            </div>
        </header>
    );
};

const HeroSection = ({ onExploreClick, onGetStartedClick, hasAssignedCourses }) => ( <main className="flex flex-col items-center justify-center text-center px-6 min-h-[85vh]" data-aos="fade-up"> <h1 className="heading text-white text-4xl sm:text-5xl md:text-7xl font-extrabold mb-4 tracking-tight"> Unleash your Inner<br /> <TypewriterText words={["Musician", "Singer", "Tabla Player", "Pianist", "Harmonist", "Guitarist", "Flutist"]} /> </h1> <p className="bodyfont text-gray-300 max-w-2xl mt-8 text-lg leading-relaxed"> Join live sessions, access recordings, and follow a structured syllabus — all in one place. </p> <div className="mt-10 flex flex-col sm:flex-row gap-6"> <button className="cta text-white px-8 py-3 rounded-lg heading text-lg font-semibold" onClick={onExploreClick}>Explore Courses</button> <button className="contact-btn text-lg heading font-semibold px-8 py-3 rounded-lg" onClick={onGetStartedClick}>{hasAssignedCourses ? 'My Class' : 'Get Started'}</button> </div> </main> );

const AboutSection = () => ( <section className="max-w-6xl mx-auto px-6 py-20" data-aos="fade-up"> <h2 className="heading text-4xl text-white text-center mb-12 font-bold" data-aos="fade-up">Why Choose Musicoul?</h2> <div className="grid grid-cols-1 md:grid-cols-3 gap-8"> {FEATURES_DATA.map((item, index) => ( <div key={index} className="about-card p-8 bg-gradient-to-b from-gray-900 to-black rounded-2xl border border-gray-800 text-center" data-aos="fade-up" data-aos-delay={`${index * 150 + 100}`}> <div className="about-icon text-5xl mb-6">{item.icon}</div> <h3 className="heading text-xl text-white mb-3 font-semibold">{item.title}</h3> <p className="bodyfont text-gray-400 leading-relaxed">{item.desc}</p> </div> ))} </div> </section> );

const TeachersSection = () => {
    const [currentIndex, setCurrentIndex] = useState(0);

    const next = () => setCurrentIndex(i => (i + 1) % TEACHERS_DATA.length);
    const prev = () => setCurrentIndex(i => (i - 1 + TEACHERS_DATA.length) % TEACHERS_DATA.length);

    return (
        <section className="py-20 overflow-hidden">
            <div className="max-w-6xl mx-auto px-6">
                <h2 className="heading text-4xl text-white text-center mb-16 font-bold" data-aos="fade-up">Our Esteemed Teachers</h2>
                <div className="relative h-96 flex items-center justify-center" data-aos="fade-up">
                    
                    <button onClick={prev} className="slider-arrow left-0 xl:-left-16">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
                    </button>

                    {TEACHERS_DATA.map((teacher, index) => {
                        const offset = (index - currentIndex + TEACHERS_DATA.length) % TEACHERS_DATA.length;
                        let transformStyle = {};
                        let zIndex = 0;
                        let opacity = 0;

                        if (offset === 0) { // Center card
                            transformStyle = { transform: 'translateX(0) scale(1)', zIndex: 3 };
                            opacity = 1;
                        } else if (offset === 1) { // Right card
                            transformStyle = { transform: 'translateX(80%) scale(0.8)', zIndex: 2 };
                            opacity = 0.6;
                        } else if (offset === TEACHERS_DATA.length - 1) { // Left card
                             transformStyle = { transform: 'translateX(-80%) scale(0.8)', zIndex: 2 };
                            opacity = 0.6;
                        } else { // Hidden cards
                             transformStyle = { transform: `translateX(${offset > TEACHERS_DATA.length / 2 ? '-160%' : '160%'}) scale(0.6)`, zIndex: 1 };
                             opacity = 0;
                        }
                        
                        return (
                            <div key={teacher.id || index} className="absolute w-80 h-96 transition-all duration-500 ease-in-out" style={{ ...transformStyle, opacity }}>
                                <div className="teacher-card-glow bg-gray-900/70 backdrop-blur-sm border border-gray-800 rounded-lg p-6 text-center h-full flex flex-col items-center justify-center teacher-card">
                                    <img src={teacher.img} alt={teacher.name} className="w-28 h-28 rounded-full object-cover mx-auto mb-6 border-4 border-gray-700"/>
                                    <h3 className="heading text-2xl font-bold text-white leading-tight">{teacher.name}</h3>
                                    <p className="bodyfont text-pink-400 mt-2 text-sm">{teacher.subjects}</p>
                                    <p className="bodyfont text-gray-400 mt-2 text-xs">{teacher.experience} of experience</p>
                                </div>
                            </div>
                        );
                    })}
                    
                    <button onClick={next} className="slider-arrow right-0 xl:-right-16">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
                    </button>
                 </div>
            </div>
        </section>
    );
};


const CoursesSection = ({ courses, onViewMore, onViewCourse }) => {
    const coursesToDisplay = (courses.length > 0 ? courses : STATIC_COURSES_DATA).slice(0, 3);
    return (
        <section className="max-w-6xl mx-auto px-6 py-20" data-aos="fade-up">
            <h2 className="heading text-4xl text-white text-center mb-12 font-bold">Explore Our Courses</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {coursesToDisplay.map((course, index) => (
                    <div key={course.id} className="card p-4" data-aos="fade-up" data-aos-delay={`${index + 1}00`}>
                        <img src={course.imageUrl} alt={course.subject} className="w-full h-48 object-cover rounded-xl mb-4" />
                        <h3 className="heading text-xl text-white mb-2 font-semibold">{course.subject} - {course.level}</h3>
                        <p className="bodyfont text-gray-400 mb-4 flex-grow">{course.description}</p>
                        <div className="mt-4">
                            <button onClick={() => onViewCourse(course)} className="card-button font-semibold w-full text-center">View Course</button>
                        </div>
                    </div>
                ))}
            </div>
            <div className="text-center mt-12">
                <button onClick={onViewMore} className="view-more-btn heading font-semibold">
                    View More
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="http://www.w3.org/2000/svg" fill="currentColor">
                        <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                </button>
            </div>
        </section>
    );
};

const ContactSection = () => (
    <section className="max-w-4xl mx-auto px-6 py-20 text-center" data-aos="fade-up">
        <h2 className="heading text-4xl text-white mb-4 font-bold">Get In Touch</h2>
        <p className="text-gray-400 bodyfont max-w-xl mx-auto mb-10">
          Have questions or ready to start your musical journey? Contact us!
        </p>
        <div className="flex flex-col sm:flex-row justify-center items-center gap-6">
          <a href="mailto:music2soul11@gmail.com" className="cta text-white px-8 py-3 rounded-lg heading text-lg font-semibold flex items-center gap-3 w-full sm:w-auto justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
            Send an Email
          </a>
          <a href="tel:+919309152986" className="contact-btn text-lg heading font-semibold px-8 py-3 rounded-lg flex items-center gap-3 w-full sm:w-auto justify-center">
             <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
            Call Us
          </a>
        </div>
      </section>
);


const Footer = ({ navItems, onNavItemClick }) => ( <footer className="bg-black text-gray-400 py-12 mt-20 border-t border-gray-800" data-aos="fade-up"> <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center text-center md:text-left gap-8"> <div> <div className="heading text-white text-2xl font-bold mb-1">Musicoul</div> <div className="bodyfont text-sm text-gray-500">© {new Date().getFullYear()} Musicoul. All rights reserved.</div> </div> <div className="flex flex-wrap justify-center gap-6 text-sm"> {navItems.filter(item => item.name !== "Home").map(item => ( <button key={item.name} onClick={() => onNavItemClick(item.id)} className="bodyfont hover:text-pink-400 transition-colors duration-300">{item.name}</button> ))} </div> </div> </footer> );

const AuthModal = ({ isOpen, onClose, initialType, onLoginSuccess }) => { const [formType, setFormType] = useState(initialType); const [isVisible, setIsVisible] = useState(false); const [error, setError] = useState(''); useEffect(() => { setFormType(initialType); setError(''); }, [initialType]); useEffect(() => { if (isOpen) { setIsVisible(true); } else { setTimeout(() => setIsVisible(false), 300); } }, [isOpen]); if (!isVisible) return null; const handleSubmit = async (e) => { e.preventDefault(); setError(''); const email = e.target.email.value; const password = e.target.password.value; try { if (formType === 'signup') { const name = e.target.name.value; const phone = e.target.phone.value; if (!name) { setError("Please enter your full name."); return; } const userCredential = await createUserWithEmailAndPassword(auth, email, password); await updateProfile(userCredential.user, { displayName: name }); await setDoc(doc(db, "users", userCredential.user.uid), { displayName: name, email: email, role: 'student', phone: phone }); } else { const userCredential = await signInWithEmailAndPassword(auth, email, password); onLoginSuccess(userCredential.user); } onClose(); } catch (err) { console.error("Firebase Auth Error:", err.code, err.message); switch (err.code) { case 'auth/invalid-credential': setError('Invalid email or password. Please try again.'); break; case 'auth/email-already-in-use': setError('An account with this email already exists. Please login.'); break; case 'auth/weak-password': setError('Password should be at least 6 characters long.'); break; default: setError('An unexpected error occurred. Please try again.'); break; } } }; return ( <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0'}`}> <div className="fixed inset-0 bg-black bg-opacity-70" onClick={onClose}></div> <div className={`bg-gray-900 border border-gray-700 rounded-xl shadow-lg w-full max-w-md m-4 transform transition-all duration-300 ${isOpen ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}`}> <div className="p-8 space-y-6"> <div className="text-center"> <h2 className="heading text-3xl font-bold text-white"> {formType === 'login' ? 'Welcome Back' : 'Create Account'} </h2> <p className="bodyfont text-gray-400 mt-2"> {formType === 'login' ? 'Login to continue your musical journey.' : 'Start your musical journey with us.'} </p> </div> <form onSubmit={handleSubmit} className="space-y-4"> {formType === 'signup' && ( <> <div> <label className="bodyfont text-sm font-medium text-gray-300 block mb-2" htmlFor="name">Full Name</label> <input type="text" id="name" name="name" required className="auth-input" placeholder="Your Name" /> </div> <div> <label className="bodyfont text-sm font-medium text-gray-300 block mb-2" htmlFor="phone">Phone Number</label> <input type="tel" id="phone" name="phone" required className="auth-input" placeholder="Your Phone Number" /> </div></> )} <div> <label className="bodyfont text-sm font-medium text-gray-300 block mb-2" htmlFor="email">Email Address</label> <input type="email" id="email" name="email" required className="auth-input" placeholder="you@example.com" /> </div> <div> <div className="flex justify-between items-center mb-2"> <label className="bodyfont text-sm font-medium text-gray-300" htmlFor="password">Password</label> {formType === 'login' && <a href="#" className="text-sm bodyfont text-pink-500 hover:underline">Forgot?</a>} </div> <input type="password" id="password" name="password" required className="auth-input" placeholder="••••••••" /> </div> {error && <p className="text-red-500 text-sm text-center bodyfont">{error}</p>} <button type="submit" className="w-full cta text-white py-3 rounded-lg heading font-semibold"> {formType === 'login' ? 'Login' : 'Sign Up'} </button> </form> <p className="bodyfont text-sm text-center text-gray-400"> {formType === 'login' ? "Don't have an account?" : "Already have an account?"} <button onClick={() => setFormType(formType === 'login' ? 'signup' : 'login')} className="font-semibold text-pink-500 hover:underline ml-2"> {formType === 'login' ? 'Sign Up' : 'Login'} </button> </p> </div> </div> </div> ); };

const MyClassPage = ({ user, assignedCourses, users, onGoHome }) => {
    const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
    const teachers = users.filter(u => u.role === 'teacher');
    
    const findTodaysClass = () => {
        for(const course of assignedCourses) {
            if (course.schedule) {
                const todaysSlot = course.schedule.find(slot => slot.day === today);
                if (todaysSlot) {
                    const teacher = teachers.find(t => t.uid === todaysSlot.teacherId);
                    return { ...todaysSlot, meetLink: teacher?.meetLink };
                }
            }
        }
        return null;
    }

    const todaysClass = findTodaysClass();

    return(
        <div className="max-w-7xl mx-auto px-6 py-12" data-aos="fade-in">
             <h1 className="heading text-white text-5xl font-extrabold mb-4 text-center">My Class Dashboard</h1>
             <p className="bodyfont text-gray-400 text-center mb-12">Welcome, {user.displayName ? user.displayName.split(' ')[0] : user.email.split('@')[0]}. Here is your weekly schedule and resources.</p>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                    <div className="admin-card">
                        <h2 className="admin-header">Weekly Schedule</h2>
                        <div className="space-y-4">
                            {assignedCourses.map(course => (
                                <div key={course.id} className="bg-gray-800 p-4 rounded-lg">
                                    <h3 className="font-bold text-white text-lg">{course.subject} - {course.level}</h3>
                                    {course.schedule && course.schedule.length > 0 ? (
                                        course.schedule.map((slot, index) => (
                                            <div key={index} className={`flex justify-between items-center mt-2 p-2 rounded ${slot.day === today ? 'bg-pink-500/20' : ''}`}>
                                                <div>
                                                   <span className="font-semibold">{slot.day} at {slot.time}</span>
                                                   <span className="text-xs text-gray-400 block">{slot.type} with {slot.teacherName}</span>
                                                </div>
                                            </div>
                                        ))
                                    ) : <p className="text-gray-400 mt-2">No schedule set for this course.</p>}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
                <div>
                     <div className="admin-card space-y-6">
                        <h2 className="admin-header">Quick Actions</h2>
                        {todaysClass && todaysClass.meetLink ? (
                             <a href={todaysClass.meetLink} target="_blank" rel="noopener noreferrer" className="block text-center cta w-full py-3 rounded-lg text-lg font-semibold">Join Class</a>
                        ) : (
                             <button className="cta w-full py-3 rounded-lg text-lg font-semibold opacity-50 cursor-not-allowed" disabled>No Class Today</button>
                        )}
                         <h2 className="admin-header pt-4">Premium Resources</h2>
                         <p className="bodyfont text-gray-400">Resources for your enrolled courses will appear here.</p>
                         <h2 className="admin-header pt-4">Attendance</h2>
                         <p className="bodyfont text-gray-400">Your attendance record will be shown here.</p>
                    </div>
                </div>
            </div>

            <div className="text-center mt-12">
                <button className="contact-btn text-lg" onClick={onGoHome}>Back to Home</button>
            </div>
        </div>
    )
};

const AdminPanelPage = ({ currentUser, users, subjects, levels, courses, handlers, onGoHome }) => {
    const [activeTab, setActiveTab] = useState('dashboard');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [assignModal, setAssignModal] = useState({isOpen: false, user: null, courseId: '', schedule: []});
    
    const { handleCreateUser, handleCreateSubject, handleCreateLevel, handleCreateCourse, handleDeleteUser, handleDeleteSubject, handleDeleteLevel, handleDeleteCourse, handleUpdateUserRole, handleAssignCourse, handleUpdateMeetLink } = handlers;

    const onUserSubmit = async (e) => { e.preventDefault(); setIsSubmitting(true); const userData = { displayName: e.target.name.value, email: e.target.email.value, phone: e.target.phone.value, }; await handleCreateUser(userData); e.target.reset(); setIsSubmitting(false); };
    const onSubjectSubmit = async (e) => { e.preventDefault(); setIsSubmitting(true); await handleCreateSubject(e.target.subjectName.value, e.target.subjectImage.value); e.target.reset(); setIsSubmitting(false); };
    const onLevelSubmit = async (e) => { e.preventDefault(); setIsSubmitting(true); const name = e.target.levelName.value; const no = e.target.levelNo.value; await handleCreateLevel(name, no); e.target.reset(); setIsSubmitting(false); };
    const onCourseSubmit = async (e) => { e.preventDefault(); setIsSubmitting(true); const courseData = { subject: e.target.courseSubject.value, level: e.target.courseLevel.value, description: e.target.courseDescription.value, imageUrl: e.target.courseImageUrl.value, imageFile: e.target.courseImageFile.files[0] }; await handleCreateCourse(courseData); e.target.reset(); setIsSubmitting(false); };
    
    const openAssignModal = async (user) => {
        const assignedCoursesRef = collection(db, `users/${user.uid}/assignedCourses`);
        const snapshot = await getDocs(assignedCoursesRef);
        const assignedCourse = snapshot.docs[0];
        if(assignedCourse) {
            setAssignModal({isOpen: true, user, courseId: assignedCourse.id, schedule: assignedCourse.data().schedule || []});
        } else {
            setAssignModal({isOpen: true, user, courseId: '', schedule: []});
        }
    }
    
    const onAssignCourseSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        const courseId = assignModal.courseId;
        const selectedCourse = courses.find(c => c.id === courseId);
        if(!selectedCourse) { alert("Please select a course."); setIsSubmitting(false); return; }
        if(assignModal.schedule.some(s => !s.teacherId)) { alert("Please select a teacher for all schedule slots."); setIsSubmitting(false); return; }

        await handleAssignCourse(assignModal.user.uid, selectedCourse, assignModal.schedule);
        setAssignModal({isOpen: false, user: null, courseId: '', schedule: []});
        setIsSubmitting(false);
    };

    const addScheduleSlot = () => setAssignModal(prev => ({...prev, schedule: [...prev.schedule, {day: 'Monday', time: '10:00', teacherId: '', teacherName: '', type: 'Teaching'}]}));
    const handleScheduleChange = (index, field, value) => {
        const newSchedule = [...assignModal.schedule];
        newSchedule[index][field] = value;
        if(field === 'teacherId'){
            const teacher = users.find(u => u.uid === value);
            newSchedule[index]['teacherName'] = teacher ? teacher.displayName : '';
        }
        setAssignModal(prev => ({...prev, schedule: newSchedule}));
    }
    const removeScheduleSlot = (index) => setAssignModal(prev => ({...prev, schedule: prev.schedule.filter((_, i) => i !== index)}));


    const AdminSidebar = () => ( <div className="w-full md:w-64 bg-gray-900 p-4 rounded-lg md:rounded-r-none md:rounded-l-lg self-start"> <h2 className="heading text-2xl font-bold text-white mb-6">Admin Menu</h2> <nav className="space-y-2"> <button onClick={() => setActiveTab('dashboard')} className={`admin-tab ${activeTab === 'dashboard' && 'admin-tab-active'}`}>Dashboard</button> <button onClick={() => setActiveTab('users')} className={`admin-tab ${activeTab === 'users' && 'admin-tab-active'}`}>Users</button><button onClick={() => setActiveTab('courses')} className={`admin-tab ${activeTab === 'courses' && 'admin-tab-active'}`}>Courses</button> </nav> </div> );
    const DashboardContent = () => ( <div className="admin-card"> <h2 className="admin-header">Dashboard</h2> <p>Welcome to the admin panel. Use the sidebar to manage site content.</p> </div> );
    const UsersContent = () => (
        <div className="space-y-8">
            <div className="admin-card">
                 <h2 className="admin-header">Create New User</h2>
                 <form onSubmit={onUserSubmit} className="space-y-4">
                     <input name="name" type="text" placeholder="Full Name" required className="auth-input" />
                     <input name="email" type="email" placeholder="Email Address" required className="auth-input" />
                     <input name="phone" type="tel" placeholder="Phone Number" required className="auth-input" />
                     <p className="text-xs text-gray-500">Note: This creates a user profile. The user must sign up with the same email to create a login.</p>
                     <button type="submit" className="cta w-full py-2 rounded-md" disabled={isSubmitting}>{isSubmitting ? 'Creating...' : 'Create User Profile'}</button>
                 </form>
            </div>
            <div className="admin-card">
                <h2 className="admin-header">Manage Users</h2>
                <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-2">
                    {users.map(user => (
                        <div key={user.uid} className="flex flex-col md:flex-row justify-between items-start md:items-center bg-gray-800 p-3 rounded gap-4">
                            <div>
                                <p className="font-bold text-white">{user.displayName}</p>
                                <p className="text-sm text-gray-400">{user.email}</p>
                                <p className="text-xs text-gray-500">{user.phone}</p>
                            </div>
                            <div className="flex flex-col items-start md:items-end gap-2">
                                <div className="flex items-center gap-2 flex-wrap">
                                     <select value={user.role} onChange={(e) => handleUpdateUserRole(user.uid, e.target.value)} className="filter-input text-sm py-1">
                                         <option value="student">Student</option>
                                         <option value="teacher">Teacher</option>
                                     </select>
                                     <button onClick={() => openAssignModal(user)} className="cta px-3 py-1 rounded text-sm">Assign</button>
                                     {user.uid !== currentUser.uid && <button onClick={() => handleDeleteUser(user.uid)} className="text-red-500 hover:text-red-400 font-bold text-2xl px-2">&times;</button>}
                                </div>
                                {user.role === 'teacher' && (
                                    <div className="flex items-center gap-2 w-full">
                                        <input type="text" placeholder="Google Meet Link" defaultValue={user.meetLink || ''} onBlur={(e) => handleUpdateMeetLink(user.uid, e.target.value)} className="filter-input text-sm py-1 flex-grow" />
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
    const CoursesContent = () => (
         <div className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="admin-card">
                    <h2 className="admin-header">Manage Subjects</h2>
                    <form onSubmit={onSubjectSubmit} className="space-y-4">
                        <input name="subjectName" type="text" placeholder="Subject Name" required className="auth-input" />
                        <input name="subjectImage" type="text" placeholder="Subject Image URL" required className="auth-input" />
                        <button type="submit" className="cta w-full py-2 rounded-md" disabled={isSubmitting}>{isSubmitting ? 'Creating...' : 'Create Subject'}</button>
                    </form>
                    <div className="mt-6">
                        <h3 className="font-bold text-lg mb-2">Existing Subjects:</h3>
                        <ul className="text-gray-300 space-y-2 max-h-40 overflow-y-auto pr-2">
                           {subjects.map(s => (<li key={s.id} className="flex justify-between items-center bg-gray-800 p-2 rounded"><span>{s.name}</span><button onClick={() => handleDeleteSubject(s.id)} className="text-red-500 hover:text-red-400 font-bold text-xl">&times;</button></li>))}
                        </ul>
                    </div>
                </div>
                <div className="admin-card">
                    <h2 className="admin-header">Manage Levels</h2>
                    <form onSubmit={onLevelSubmit} className="space-y-4">
                        <input name="levelName" type="text" placeholder="Level Name" required className="auth-input" />
                        <input name="levelNo" type="number" placeholder="Level No." required className="auth-input" />
                        <button type="submit" className="cta w-full py-2 rounded-md" disabled={isSubmitting}>{isSubmitting ? 'Creating...' : 'Create Level'}</button>
                    </form>
                    <div className="mt-6">
                        <h3 className="font-bold text-lg mb-2">Existing Levels:</h3>
                        <ul className="text-gray-300 space-y-2 max-h-40 overflow-y-auto pr-2">
                            {levels.sort((a, b) => a.no - b.no).map(l => (<li key={l.id} className="flex justify-between items-center bg-gray-800 p-2 rounded"><span>{l.no}. {l.name}</span><button onClick={() => handleDeleteLevel(l.id)} className="text-red-500 hover:text-red-400 font-bold text-xl">&times;</button></li>))}
                        </ul>
                    </div>
                </div>
                <div className="admin-card">
                    <h2 className="admin-header">Create Course</h2>
                    <form onSubmit={onCourseSubmit} className="space-y-4">
                         <select name="courseSubject" required className="auth-input"><option value="">Select Subject</option>{subjects.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}</select>
                        <select name="courseLevel" required className="auth-input"><option value="">Select Level</option>{levels.sort((a,b) => a.no - b.no).map(l => <option key={l.id} value={l.name}>{l.no}. {l.name}</option>)}</select>
                        <textarea name="courseDescription" placeholder="Course Description" required className="auth-input min-h-[80px]"></textarea>
                        <input name="courseImageUrl" type="text" placeholder="Course Image URL" className="auth-input" />
                        <div><label className="bodyfont text-sm text-gray-300 block mb-2" htmlFor="courseImageFile">Or Upload Image:</label><input name="courseImageFile" id="courseImageFile" type="file" className="text-gray-300" /></div>
                        <button type="submit" className="cta w-full py-2 rounded-md" disabled={isSubmitting}>{isSubmitting ? 'Creating...' : 'Create Course'}</button>
                    </form>
                </div>
            </div>
            <div className="admin-card">
                <h2 className="admin-header">Manage Existing Courses</h2>
                <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
                    {courses.map(course => ( <div key={course.id} className="flex justify-between items-center bg-gray-800 p-3 rounded"> <div> <p className="font-bold text-white">{course.subject} - {course.level}</p> <p className="text-sm text-gray-400">{course.description}</p> </div> <button onClick={() => handleDeleteCourse(course.id)} className="text-red-500 hover:text-red-400 font-bold text-2xl p-2">&times;</button> </div> ))}
                </div>
            </div>
        </div>
    );
    
    const AssignCourseModal = () => {
        if (!assignModal.isOpen) return null;
        const teachers = users.filter(u => u.role === 'teacher');

        return(
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <div className="fixed inset-0 bg-black bg-opacity-70" onClick={() => setAssignModal({isOpen: false, user: null, schedule: []})}></div>
                <div className="bg-gray-900 border border-gray-700 rounded-xl shadow-lg w-full max-w-2xl m-4 z-10">
                    <form onSubmit={onAssignCourseSubmit} className="p-8 space-y-4">
                        <h2 className="admin-header">Assign Course to {assignModal.user.displayName}</h2>
                        <select value={assignModal.courseId} onChange={(e) => setAssignModal(p => ({...p, courseId: e.target.value}))} required className="auth-input">
                            <option value="">Select a Course</option>
                            {courses.map(c => <option key={c.id} value={c.id}>{c.subject} - {c.level}</option>)}
                        </select>
                        <h3 className="font-bold text-lg pt-4">Set Schedule</h3>
                        <div className="space-y-4 max-h-64 overflow-y-auto pr-2">
                            {assignModal.schedule.map((slot, index) => (
                                <div key={index} className="bg-gray-800 p-3 rounded-md space-y-2">
                                    <div className="flex justify-between items-center">
                                        <p className="font-semibold text-white">Class Slot {index + 1}</p>
                                        <button type="button" onClick={() => removeScheduleSlot(index)} className="text-red-500 hover:text-red-400 font-bold text-xl">&times;</button>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                         <select value={slot.day} onChange={(e) => handleScheduleChange(index, 'day', e.target.value)} className="auth-input">
                                            <option>Monday</option><option>Tuesday</option><option>Wednesday</option><option>Thursday</option><option>Friday</option><option>Saturday</option><option>Sunday</option>
                                        </select>
                                        <input value={slot.time} onChange={(e) => handleScheduleChange(index, 'time', e.target.value)} type="time" required className="auth-input" />
                                        <select value={slot.teacherId} onChange={(e) => handleScheduleChange(index, 'teacherId', e.target.value)} required className="auth-input">
                                            <option value="">Select Teacher</option>
                                            {teachers.map(t => <option key={t.uid} value={t.uid}>{t.displayName}</option>)}
                                        </select>
                                        <select value={slot.type} onChange={(e) => handleScheduleChange(index, 'type', e.target.value)} className="auth-input">
                                            <option>Teaching</option><option>Revision</option><option>Event</option>
                                        </select>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <button type="button" onClick={addScheduleSlot} className="contact-btn w-full py-2 text-sm">Add Schedule Slot</button>
                        <div className="flex justify-end gap-4 pt-4">
                            <button type="button" onClick={() => setAssignModal({isOpen: false, user: null, schedule: []})} className="contact-btn px-4 py-2 text-sm">Cancel</button>
                            <button type="submit" disabled={isSubmitting} className="cta px-4 py-2 text-sm rounded-md">{isSubmitting ? 'Assigning...' : 'Save Schedule'}</button>
                        </div>
                    </form>
                </div>
            </div>
        )
    };

    return (
        <div className="max-w-7xl mx-auto px-6 py-12" data-aos="fade-in">
            <h1 className="heading text-white text-4xl font-extrabold mb-8 text-center">Admin Panel</h1>
            <div className="flex flex-col md:flex-row gap-8">
                <AdminSidebar />
                <div className="flex-grow">
                    {activeTab === 'dashboard' && <DashboardContent />}
                    {activeTab === 'users' && <UsersContent />}
                    {activeTab === 'courses' && <CoursesContent />}
                </div>
            </div>
             <div className="text-center mt-10">
                <button className="contact-btn text-lg" onClick={onGoHome}>Back to Home</button>
            </div>
            <AssignCourseModal />
        </div>
    );
};

const CoursePreviewModal = ({ course, onClose }) => {
    if (!course) return null;
    return (
         <div className="fixed inset-0 z-50 flex items-center justify-center p-4 transition-opacity duration-300 opacity-100">
            <div className="fixed inset-0 bg-black bg-opacity-80" onClick={onClose}></div>
            <div className={`bg-gray-900 border border-gray-700 rounded-xl shadow-lg w-full max-w-2xl m-4 transform transition-all duration-300 scale-100 opacity-100`}>
                <div className="p-2">
                    <img src={course.imageUrl} alt={course.subject} className="w-full h-64 object-cover rounded-lg mb-4" />
                    <div className="px-6 pb-6">
                         <h2 className="heading text-3xl font-bold text-white">{course.subject} - {course.level}</h2>
                         <p className="bodyfont text-gray-300 mt-4 leading-relaxed">{course.description}</p>
                         <div className="mt-6 text-right">
                             <button onClick={onClose} className="contact-btn text-md">Close</button>
                         </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const CoursesPage = ({ courses, subjects, levels, onViewCourse, onGoHome }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedSubject, setSelectedSubject] = useState('');
    const [selectedLevel, setSelectedLevel] = useState('');

    const allCourses = courses.length > 0 ? courses : STATIC_COURSES_DATA;

    const filteredCourses = allCourses.filter(course => {
        const searchMatch = searchTerm === '' || course.subject.toLowerCase().includes(searchTerm.toLowerCase()) || course.level.toLowerCase().includes(searchTerm.toLowerCase());
        const subjectMatch = selectedSubject === '' || course.subject === selectedSubject;
        const levelMatch = selectedLevel === '' || course.level === selectedLevel;
        return searchMatch && subjectMatch && levelMatch;
    });

    return (
        <div className="max-w-7xl mx-auto px-6 py-12" data-aos="fade-in">
             <h1 className="heading text-white text-5xl font-extrabold mb-8 text-center">Our Courses</h1>
             
             <div className="mb-8 p-4 bg-black/50 border border-gray-800 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="relative">
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                        </span>
                        <input type="text" placeholder="Search courses..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="filter-input pl-10" />
                    </div>
                     <select value={selectedSubject} onChange={e => setSelectedSubject(e.target.value)} className="filter-input">
                         <option value="">All Subjects</option>
                         {subjects.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                     </select>
                     <select value={selectedLevel} onChange={e => setSelectedLevel(e.target.value)} className="filter-input">
                         <option value="">All Levels</option>
                          {levels.sort((a,b) => a.no - b.no).map(l => <option key={l.id} value={l.name}>{l.name}</option>)}
                     </select>
                </div>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredCourses.length > 0 ? filteredCourses.map((course, index) => (
                     <div key={course.id} className="card p-4" data-aos="fade-up" data-aos-delay={`${index * 100}`}>
                        <img src={course.imageUrl} alt={course.subject} className="w-full h-48 object-cover rounded-xl mb-4" />
                        <h3 className="heading text-xl text-white mb-2 font-semibold">{course.subject} - {course.level}</h3>
                        <p className="bodyfont text-gray-400 mb-4 flex-grow">{course.description}</p>
                        <div className="mt-4">
                            <button onClick={() => onViewCourse(course)} className="card-button font-semibold w-full text-center">View Course</button>
                        </div>
                    </div>
                )) : <p className="text-gray-400 col-span-full text-center py-12 bodyfont">No courses match your criteria.</p>}
             </div>
              <div className="text-center mt-12">
                <button className="contact-btn text-lg" onClick={onGoHome}>Back to Home</button>
            </div>
        </div>
    );
};


// --- Main App Component ---

export default function MusicoulPremium() {
    
    const [authModal, setAuthModal] = useState({ isOpen: false, type: 'login' });
    const [currentUser, setCurrentUser] = useState(null);
    const [assignedCourses, setAssignedCourses] = useState([]);
    const [currentPage, setCurrentPage] = useState('home');
    const [users, setUsers] = useState([]); // All users for admin
    const [subjects, setSubjects] = useState([]);
    const [levels, setLevels] = useState([]);
    const [courses, setCourses] = useState([]);
    const [teachers, setTeachers] = useState([]);
    const [previewCourse, setPreviewCourse] = useState(null);

    const sectionRefs = { home: useRef(null), courses: useRef(null), teachers: useRef(null), about: useRef(null), contact: useRef(null), };
    
    useEffect(() => {
        let unsubscribeAll = [];
        
        const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
            unsubscribeAll.forEach(unsub => unsub());
            unsubscribeAll = [];
            
            setCurrentUser(user);

            if (user) {
                const userDocRef = doc(db, "users", user.uid);
                const docSnap = await getDoc(userDocRef);
                if (!docSnap.exists() && user.email) {
                    await setDoc(userDocRef, {
                        displayName: user.displayName,
                        email: user.email,
                        role: user.email === ADMIN_EMAIL ? 'admin' : 'student',
                        phone: user.phoneNumber || ''
                    });
                }

                const unsubCourses = onSnapshot(collection(db, "courses"), (snapshot) => { setCourses(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))); });
                unsubscribeAll.push(unsubCourses);
                
                const unsubAssigned = onSnapshot(collection(db, `users/${user.uid}/assignedCourses`), (snapshot) => {
                    setAssignedCourses(snapshot.docs.map(doc => ({id: doc.id, ...doc.data()})));
                });
                unsubscribeAll.push(unsubAssigned);

                if (user.email === ADMIN_EMAIL) {
                    const unsubUsers = onSnapshot(collection(db, "users"), (snapshot) => {
                         setUsers(snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() })));
                    });
                     const unsubSubjects = onSnapshot(collection(db, "subjects"), (snapshot) => {
                        setSubjects(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
                    });
                    const unsubLevels = onSnapshot(collection(db, "levels"), (snapshot) => {
                        setLevels(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
                    });
                    unsubscribeAll.push(unsubUsers, unsubSubjects, unsubLevels);
                }
            } else {
                setCourses([]); setUsers([]); setSubjects([]); setLevels([]); setAssignedCourses([]); setTeachers([]);
            }
        });

        return () => {
            unsubscribeAuth();
            unsubscribeAll.forEach(unsub => unsub());
        };
    }, []);


    useEffect(() => {
        const aosCssLink = document.createElement('link'); aosCssLink.rel = 'stylesheet'; aosCssLink.href = 'https://unpkg.com/aos@2.3.1/dist/aos.css'; document.head.appendChild(aosCssLink);
        const aosScript = document.createElement('script'); aosScript.src = 'https://unpkg.com/aos@2.3.1/dist/aos.js'; aosScript.async = true;
        aosScript.onload = () => { if (window.AOS) { window.AOS.init({ duration: 1000, once: true }); } };
        document.body.appendChild(aosScript);
        const fontLink = document.createElement('link'); fontLink.href = "https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&family=Playfair+Display:wght@400;700;900&display=swap"; fontLink.rel = "stylesheet";
        const styleTag = document.createElement('style');
        styleTag.innerHTML = `
            .heading { font-family: 'Playfair Display', serif; } 
            .bodyfont { font-family: 'Poppins', sans-serif; }
            ::-webkit-scrollbar { width: 8px; }
            ::-webkit-scrollbar-track { background: #111; }
            ::-webkit-scrollbar-thumb { background: linear-gradient(180deg, #6b21a8, #ef4444, #f472b6); border-radius: 4px; }
            .scrollbar-hide::-webkit-scrollbar { display: none; }
            .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
            .cta { background: linear-gradient(90deg, #6b21a8, #ef4444, #f472b6); transition: all 0.3s ease-in-out; } 
            .cta:hover { transform: scale(1.05); box-shadow: 0 10px 25px rgba(255, 0, 128, 0.3); }
            .contact-btn { border: 2px solid #6b21a8; background: transparent; color: #fff; transition: all 0.3s ease-in-out; } 
            .contact-btn:hover { background: #6b21a8; color: #fff; transform: scale(1.05); }
            .card { background: linear-gradient(135deg, #1f1f1f, #0f0f1f); border: 1px solid #2a2a2a; border-radius: 1rem; overflow: hidden; transition: all .3s ease-in-out; display: flex; flex-direction: column; } 
            .card:hover { transform: translateY(-8px); box-shadow: 0 20px 40px rgba(244, 114, 182, 0.2); border-color: #f472b6; }
            .card-button { background: linear-gradient(90deg, #6b21a8, #ef4444, #f472b6); color: #fff; padding: .75rem 1.25rem; border-radius: .5rem; transition: transform .3s ease-in-out; } 
            .card-button:hover { transform: scale(1.05); }
            .view-more-btn { background: transparent; border: 2px solid #ffffff; color: #ffffff; padding: 0.75rem 1.5rem; border-radius: 9999px; font-size: 1.125rem; transition: all .3s ease-in-out; display: inline-flex; align-items: center; gap: 0.5rem; } 
            .view-more-btn svg { transition: transform 0.3s ease-in-out; } 
            .view-more-btn:hover { background: #ffffff; color: #000000; transform: scale(1.05); box-shadow: 0 10px 25px rgba(255, 255, 255, 0.2); } 
            .view-more-btn:hover svg { transform: translateX(5px); }
            .auth-input, .filter-input { background-color: #1f2937; border: 1px solid #4b5563; color: #d1d5db; width: 100%; padding: 0.75rem; border-radius: 0.5rem; transition: border-color 0.3s, box-shadow 0.3s; } 
            .auth-input:focus, .filter-input:focus { outline: none; border-color: #ec4899; box-shadow: 0 0 0 2px rgba(236, 72, 153, 0.3); }
            .filter-input { background-color: #111827; border-color: #374151; }
            .filter-input::placeholder { color: #6b7280 }
            .about-card { transition: transform 0.3s ease, box-shadow 0.3s ease, border-color 0.3s ease; } 
            .about-card:hover { transform: translateY(-10px); border-color: rgba(236, 72, 153, 0.5); box-shadow: 0 25px 50px -12px rgba(236, 72, 153, 0.25); }
            .about-icon { transition: transform 0.3s ease, color 0.3s ease; }
            .about-card:hover .about-icon { transform: scale(1.1); color: #f472b6; }
            .admin-card { background: #1a1a1a; padding: 1.5rem; border-radius: 1rem; border: 1px solid #333; }
            .admin-header { font-family: 'Playfair Display', serif; font-size: 1.5rem; font-weight: bold; margin-bottom: 1rem; color: #ec4899; }
            .admin-tab { width: 100%; text-align: left; padding: 0.75rem 1rem; border-radius: 0.5rem; font-weight: 600; transition: background-color 0.2s, color 0.2s; }
            .admin-tab-active { background-color: #ec4899; color: white; }
            .admin-tab:not(.admin-tab-active):hover { background-color: #374151; }
            .teacher-card { transition: transform 0.3s ease, box-shadow 0.3s ease; }
            .teacher-card:hover { transform: translateY(-5px); box-shadow: 0 10px 20px rgba(0,0,0,0.2); }
            .teacher-card-glow { box-shadow: 0 0 15px rgba(192, 132, 252, 0.3), 0 0 30px rgba(236, 72, 153, 0.2); }
            .slider-arrow { position: absolute; top: 50%; transform: translateY(-50%); z-index: 10; background-color: rgba(0,0,0,0.3); color: white; border-radius: 50%; width: 3rem; height: 3rem; display: flex; align-items: center; justify-content: center; transition: background-color 0.2s; border: 1px solid #4a4a4a}
            .slider-arrow:hover { background-color: rgba(236, 72, 153, 0.8); }
        `;
        document.head.appendChild(fontLink); document.head.appendChild(styleTag);
        return () => { if (document.head.contains(aosCssLink)) document.head.removeChild(aosCssLink); if (document.body.contains(aosScript)) document.body.removeChild(aosScript); if (document.head.contains(fontLink)) document.head.removeChild(fontLink); if (document.head.contains(styleTag)) document.head.removeChild(styleTag); };
    }, []);

    const handleNavItemClick = (id) => {
        if (id === 'courses') { setCurrentPage('coursesPage'); } 
        else if (id === 'myClass') { setCurrentPage('myClass'); } 
        else {
            setCurrentPage('home');
            setTimeout(() => {
                if (sectionRefs[id] && sectionRefs[id].current) {
                    sectionRefs[id].current.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            }, 100);
        }
    };

    const handleOpenAuthModal = (type) => setAuthModal({ isOpen: true, type });
    const handleCloseAuthModal = () => setAuthModal({ isOpen: false, type: 'login' });
    const handleLogout = async () => { try { await signOut(auth); setCurrentPage('home'); } catch (error) { console.error("Error signing out: ", error); } };
    
    const handleGetStartedClick = () => {
        if (currentUser && !currentUser.isAnonymous) {
            if (assignedCourses.length > 0) {
                setCurrentPage('myClass');
            } else {
                setCurrentPage('coursesPage');
            }
        } else {
            handleOpenAuthModal('login');
        }
    };
    
    const handleLoginSuccess = async (user) => {
        const assignedCoursesRef = collection(db, `users/${user.uid}/assignedCourses`);
        const snapshot = await getDocs(assignedCoursesRef);
        if (!snapshot.empty) {
            setCurrentPage('myClass');
        } else {
            setCurrentPage('home');
        }
    };

    // --- Admin Handlers ---
    const adminHandlers = {
        handleCreateUser: async (userData) => { try { await addDoc(collection(db, "users"), { ...userData, role: 'student' });} catch(e) { console.error("Error creating user profile:", e); }},
        handleDeleteUser: async (uid) => { try { await deleteDoc(doc(db, "users", uid)); } catch(e) { console.error("Error deleting user:", e); }},
        handleCreateSubject: async (name, imageUrl) => { try { await addDoc(collection(db, "subjects"), { name, imageUrl }); } catch (e) { console.error("Error adding subject: ", e); } },
        handleCreateLevel: async (name, no) => { try { await addDoc(collection(db, "levels"), { name, no: Number(no) }); } catch (e) { console.error("Error adding level: ", e); } },
        handleDeleteSubject: async (id) => { try { await deleteDoc(doc(db, "subjects", id)); } catch(e) { console.error("Error deleting subject:", e); } },
        handleDeleteLevel: async (id) => { try { await deleteDoc(doc(db, "levels", id)); } catch(e) { console.error("Error deleting level:", e); } },
        handleDeleteCourse: async (id) => { try { await deleteDoc(doc(db, "courses", id)); } catch(e) { console.error("Error deleting course:", e); } },
        handleUpdateUserRole: async (uid, role) => { try { await setDoc(doc(db, "users", uid), { role }, { merge: true }); } catch (e) { console.error("Error updating role:", e); } },
        handleUpdateMeetLink: async(uid, link) => { try { await setDoc(doc(db, "users", uid), { meetLink: link }, { merge: true }); } catch (e) { console.error("Error updating meet link:", e); }},
        handleAssignCourse: async (uid, course, schedule) => { try { await setDoc(doc(db, `users/${uid}/assignedCourses`, course.id), { ...course, schedule }); } catch(e) { console.error("Error assigning course:", e); }},
        handleCreateCourse: async (courseData) => {
            try {
                let imageUrl = courseData.imageUrl;
                if (courseData.imageFile) {
                    const storageRef = ref(storage, `course_images/${Date.now()}_${courseData.imageFile.name}`);
                    const snapshot = await uploadBytes(storageRef, courseData.imageFile);
                    imageUrl = await getDownloadURL(snapshot.ref);
                }
                if (!imageUrl) { alert("Please provide an image URL or upload an image file."); return; }
                await addDoc(collection(db, "courses"), {
                    subject: courseData.subject,
                    level: courseData.level,
                    description: courseData.description,
                    imageUrl: imageUrl,
                });
            } catch (e) { console.error("Error creating course: ", e); }
        },
    };

    const renderHomePage = () => (
        <>
            <div ref={sectionRefs.home}>
                <HeroSection 
                    onExploreClick={() => setCurrentPage('coursesPage')} 
                    onGetStartedClick={handleGetStartedClick}
                    hasAssignedCourses={assignedCourses.length > 0}
                />
            </div>
            <div ref={sectionRefs.about}><AboutSection /></div>
            <div ref={sectionRefs.courses}>
                <CoursesSection 
                    courses={courses} 
                    onViewMore={() => setCurrentPage('coursesPage')}
                    onViewCourse={setPreviewCourse}
                />
            </div>
            <div ref={sectionRefs.teachers}><TeachersSection /></div>
            <div ref={sectionRefs.contact}><ContactSection /></div>
            <Footer navItems={NAV_ITEMS} onNavItemClick={handleNavItemClick} />
        </>
    );

    const renderPage = () => {
        switch (currentPage) {
            case 'home':
                return renderHomePage();
            case 'coursesPage':
                 return <CoursesPage courses={courses} subjects={subjects} levels={levels} onViewCourse={setPreviewCourse} onGoHome={() => setCurrentPage('home')} />;
            case 'myClass':
                 return currentUser && !currentUser.isAnonymous ? <MyClassPage user={currentUser} users={users} assignedCourses={assignedCourses} onGoHome={() => setCurrentPage('home')} /> : renderHomePage();
            case 'admin':
                return currentUser?.email === ADMIN_EMAIL ? <AdminPanelPage currentUser={currentUser} users={users} subjects={subjects} levels={levels} courses={courses} handlers={adminHandlers} onGoHome={() => setCurrentPage('home')} /> : renderHomePage();
            default:
                return renderHomePage();
        }
    }

    return (
        <div className="min-h-screen text-gray-100 bg-black bodyfont">
            <Header navItems={NAV_ITEMS} onNavItemClick={handleNavItemClick} onLoginClick={() => handleOpenAuthModal('login')} onSignupClick={() => handleOpenAuthModal('signup')} currentUser={currentUser} onLogout={handleLogout} onAdminClick={() => setCurrentPage('admin')} hasAssignedCourses={assignedCourses.length > 0} />

            {renderPage()}

            <AuthModal isOpen={authModal.isOpen} initialType={authModal.type} onClose={handleCloseAuthModal} onLoginSuccess={handleLoginSuccess} />
            <CoursePreviewModal course={previewCourse} onClose={() => setPreviewCourse(null)} />
        </div>
    );
}

