import { useEffect, useState, useRef } from 'react';
import './App.css';

function App() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [isVideoVisible, setIsVideoVisible] = useState(false);
  const [videoSourceError, setVideoSourceError] = useState(false);
  
  const videoRef = useRef(null);
  const statsRef = useRef(null);

  // Scroll Progress Bar
  useEffect(() => {
    const progressBar = document.createElement('div');
    progressBar.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 0%;
        height: 2px;
        background: linear-gradient(90deg, #00ffff, #ff0080);
        z-index: 9999;
        transition: width 0.1s ease;
    `;
    document.body.appendChild(progressBar);

    const updateProgress = () => {
        const scrollTop = window.pageYOffset;
        const docHeight = document.body.scrollHeight - window.innerHeight;
        const scrollPercent = (scrollTop / docHeight) * 100;
        progressBar.style.width = scrollPercent + '%';
    };

    window.addEventListener('scroll', updateProgress);
    return () => {
        window.removeEventListener('scroll', updateProgress);
        if (document.body.contains(progressBar)) {
            document.body.removeChild(progressBar);
        }
    };
  }, []);

  // Particles
  useEffect(() => {
    const particlesContainer = document.getElementById('particles');
    if (particlesContainer) {
        particlesContainer.innerHTML = ''; // Clear existing
        const particleCount = 15;
        for (let i = 0; i < particleCount; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle';
            particle.style.left = Math.random() * 100 + '%';
            particle.style.animationDelay = Math.random() * 20 + 's';
            particle.style.animationDuration = (Math.random() * 10 + 15) + 's';
            particlesContainer.appendChild(particle);
        }
    }
  }, []);

  // Scroll Animations
  useEffect(() => {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-in');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    const animatedElements = document.querySelectorAll('.animate-on-scroll, .animate-fade-in, .animate-slide-left, .animate-slide-right, .animate-scale');
    animatedElements.forEach(el => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  // Stats Animation
  useEffect(() => {
    const animateStats = () => {
        const statNumbers = document.querySelectorAll('.stat-number');
        const targets = ['150+', '10+', '20+', '24/7'];
        
        statNumbers.forEach((stat, index) => {
            const target = targets[index];
            if (target.includes('/')) {
                stat.textContent = target;
            } else {
                const num = parseInt(target.replace('+', ''));
                animateNumber(stat, num, '+');
            }
        });
    };

    const animateNumber = (element, target, suffix = '') => {
        let current = 0;
        const increment = target / 50;
        const timer = setInterval(() => {
            current += increment;
            if (current >= target) {
                current = target;
                clearInterval(timer);
            }
            element.textContent = Math.floor(current) + suffix;
        }, 40);
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                animateStats();
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.5 });

    if (statsRef.current) {
        observer.observe(statsRef.current);
    }

    return () => observer.disconnect();
  }, []);

  // Auto Open Manual
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const shouldOpenManual = urlParams.get('manual') === 'true';
    
    if (shouldOpenManual) {
        const indicator = document.getElementById('autoOpenIndicator');
        if (indicator) {
            setTimeout(() => indicator.classList.add('show'), 500);
            setTimeout(() => indicator.classList.remove('show'), 3500);
        }
        setTimeout(() => setIsModalOpen(true), 1000);
    }
  }, []);

  useEffect(() => {
      if (isModalOpen) {
          document.body.style.overflow = 'hidden';
      } else {
          document.body.style.overflow = 'auto';
      }
  }, [isModalOpen]);

  // Video Handling
  const handleVideoLoaded = () => {
      console.log('Video cargado exitosamente');
      setVideoLoaded(true);
      setIsVideoVisible(true);
  };

  const handleVideoError = (e) => {
      console.log('Error al cargar el video:', e);
      setVideoError(true);
  };

  return (
    <>
        <div id="autoOpenIndicator" className="auto-open-indicator">
            Manual abierto automáticamente
        </div>

        <div className="particles" id="particles"></div>

        <div className="floating-buttons">
            <button 
                className="manual-float" 
                id="manualBtn" 
                title="Manual de Usuario - Guía completa de instalación y uso"
                onClick={() => setIsModalOpen(true)}
            >
                MANUAL
            </button>
            <a href="https://wa.me/51942059874?text=Hola%2C%20estoy%20interesado%20en%20el%20servicio%20IPTV%20de%20FASTNET%20TV.%20%C2%BFPodr%C3%ADan%20brindarme%20m%C3%A1s%20informaci%C3%B3n%3F" className="whatsapp-float" target="_blank" title="¡Escríbenos ahora! Respuesta inmediata 24/7" rel="noreferrer">
                <img src="https://static.whatsapp.net/rsrc.php/v4/yP/r/rYZqPCBaG70.png" alt="WhatsApp" className="whatsapp-icon" />
            </a>
        </div>

        {isModalOpen && (
            <div id="manualModal" className="modal show" style={{display: 'block'}} onClick={(e) => {
                if (e.target.className.includes('modal')) setIsModalOpen(false);
            }}>
                <div className="modal-content">
                    <div className="modal-header">
                        <h2 className="modal-title">Manual de Usuario FASTNET TV</h2>
                        <span className="close" onClick={() => setIsModalOpen(false)}>&times;</span>
                    </div>
                    <div className="modal-body">
                        <div className="manual-section">
                            <h3>1. Descarga e Instalación</h3>
                            <p><strong>Para Celular:</strong></p>
                            <ol>
                                <li>Descarga el archivo APK desde el botón "Descargar para Celular"</li>
                                <li>Ve a Configuración &gt; Seguridad &gt; Permitir instalación de fuentes desconocidas</li>
                                <li>Instala la aplicación descargada</li>
                                <li>Abre FASTNET TV</li>
                            </ol>
                            
                            <p><strong>Para Android TV:</strong></p>
                            <ol>
                                <li>Descarga el archivo APK desde el botón "Descargar para Android TV"</li>
                                <li>Transfiere el archivo a tu Android TV via USB o descarga directa</li>
                                <li>Instala usando un explorador de archivos</li>
                                <li>Abre FASTNET TV desde el menú de aplicaciones</li>
                            </ol>
                        </div>

                        <div className="manual-section">
                            <h3>2. Configuración Inicial</h3>
                            <p>Al abrir la aplicación por primera vez:</p>
                            <ul>
                                <li>Ingresa tu usuario y contraseña proporcionados</li>
                                <li>La aplicación se configurará automáticamente</li>
                                <li>Espera a que cargue la lista de canales</li>
                                <li>¡Listo para disfrutar!</li>
                            </ul>
                        </div>

                        <div className="manual-section">
                            <h3>3. Navegación y Uso</h3>
                            <p><strong>Canales en Vivo:</strong></p>
                            <ul>
                                <li>Navega por categorías: Deportes, Noticias, Entretenimiento, etc.</li>
                                <li>Usa el control remoto o toca la pantalla para cambiar canales</li>
                                <li>Presiona OK/Enter para ver información del programa</li>
                            </ul>
                            
                            <p><strong>Películas y Series:</strong></p>
                            <ul>
                                <li>Accede desde el menú principal</li>
                                <li>Busca por género, año o título</li>
                                <li>Selecciona y disfruta en alta calidad</li>
                            </ul>
                        </div>

                        <div className="manual-section">
                            <h3>4. Funciones Avanzadas</h3>
                            <ul>
                                <li><strong>Favoritos:</strong> Marca tus canales preferidos</li>
                                <li><strong>EPG:</strong> Guía de programación de 7 días</li>
                                <li><strong>Grabación:</strong> Graba tus programas favoritos</li>
                                <li><strong>Control Parental:</strong> Bloquea contenido para niños</li>
                                <li><strong>Multi-idioma:</strong> Cambia audio y subtítulos</li>
                            </ul>
                        </div>

                        <div className="manual-section">
                            <h3>5. Solución de Problemas</h3>
                            <p><strong>Si la aplicación no carga:</strong></p>
                            <ul>
                                <li>Verifica tu conexión a internet</li>
                                <li>Reinicia la aplicación</li>
                                <li>Limpia caché de la aplicación</li>
                                <li>Contacta soporte técnico</li>
                            </ul>
                            
                            <p><strong>Si hay cortes o buffering:</strong></p>
                            <ul>
                                <li>Verifica velocidad de internet (mínimo 5 Mbps)</li>
                                <li>Cambia calidad de video en configuración</li>
                                <li>Reinicia tu router</li>
                                <li>Usa conexión por cable ethernet si es posible</li>
                            </ul>
                        </div>

                        <div className="manual-section">
                            <h3>6. Soporte Técnico</h3>
                            <p>Para cualquier consulta o problema:</p>
                            <ul>
                                <li><strong>WhatsApp:</strong> +51 942 059 874</li>
                                <li><strong>Horario:</strong> 24/7 disponible</li>
                                <li><strong>Respuesta:</strong> Inmediata</li>
                                <li><strong>Soporte:</strong> Instalación, configuración y uso</li>
                            </ul>
                        </div>

                        <div className="video-section">
                            <h3>7. Video Tutorial</h3>
                            <p style={{color: '#b0ffb0', marginBottom: '1.5rem'}}>
                                Mira nuestro video tutorial completo para aprender a usar FASTNET TV paso a paso:
                            </p>
                            <div className="video-container">
                                {(!videoLoaded || videoError) && (
                                    <div className="video-placeholder" id="videoPlaceholder">
                                        <div>
                                            <div style={{fontSize: '2rem', marginBottom: '1rem'}}>{videoError ? '❌' : '🎥'}</div>
                                            <div>{videoError ? 'Video no encontrado' : 'Video Tutorial Próximamente'}</div>
                                            <div style={{fontSize: '0.8rem', marginTop: '0.5rem', opacity: 0.7}}>
                                                {videoError ? 'Verifica que el archivo esté en la carpeta public' : 'El video se cargará automáticamente cuando esté disponible'}
                                            </div>
                                        </div>
                                    </div>
                                )}
                                <video 
                                    id="tutorialVideo" 
                                    controls 
                                    style={{width: '100%', height: 'auto', display: isVideoVisible ? 'block' : 'none'}}
                                    ref={videoRef}
                                    onLoadedMetadata={handleVideoLoaded}
                                    onError={handleVideoError}
                                    src="/tuto_tv.mp4"
                                >
                                    Tu navegador no soporta el elemento de video.
                                </video>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )}

        <header className="animate-fade-in">
            <div className="header-content">
                <div className="logo-container animate-slide-left">
                    <img src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/logo-tv-fastnet-tv%20%281%29-rLCHUQOC9YG6UWVKODHZD65LRPhBh4.png" alt="FASTNET TV Logo" className="logo-image" />
                </div>
                <div className="brand-text animate-slide-right">
                    <div className="logo-text">FASTNET TV</div>
                    <div className="tagline">Experiencia IPTV Premium</div>
                </div>
            </div>
        </header>

        <div className="container">
            <section className="hero animate-on-scroll">
                <h1>Entretenimiento Sin Límites</h1>
                <p>Canales en vivo, películas recién estrenadas, series completas y contenido internacional. Todo en una sola plataforma con la mejor calidad de streaming.</p>
            </section>

            <section className="iptv-info animate-on-scroll">
                <h2>¿Qué es IPTV?</h2>
                <p>IPTV (Internet Protocol Television) es la tecnología que te permite ver televisión a través de internet con la mejor calidad. Con FASTNET TV accedes a un mundo completo de entretenimiento.</p>
                
                <div className="content-types">
                    <div className="content-type animate-on-scroll animate-delay-1">
                        <h3>📺 Canales en Vivo</h3>
                        <p>Miles de canales nacionales, locales e internacionales de todas las categorías: deportes, noticias, entretenimiento, infantiles y más.</p>
                    </div>
                    <div className="content-type animate-on-scroll animate-delay-2">
                        <h3>🎬 Películas & Series</h3>
                        <p>Los últimos estrenos de cine, películas clásicas y series completas. Contenido actualizado constantemente.</p>
                    </div>
                    <div className="content-type animate-on-scroll animate-delay-3">
                        <h3>🌍 Contenido Global</h3>
                        <p>Acceso a contenido de todo el mundo en múltiples idiomas y con la mejor calidad de imagen.</p>
                    </div>
                </div>
            </section>

            <div className="stats" ref={statsRef}>
                <div className="stat-item animate-scale animate-delay-1">
                    <div className="stat-number">150+</div>
                    <div className="stat-label">Canales</div>
                </div>
                <div className="stat-item animate-scale animate-delay-2">
                    <div className="stat-number">10+</div>
                    <div className="stat-label">Películas</div>
                </div>
                <div className="stat-item animate-scale animate-delay-3">
                    <div className="stat-number">20+</div>
                    <div className="stat-label">Series</div>
                </div>
                <div className="stat-item animate-scale animate-delay-4">
                    <div className="stat-number">24/7</div>
                    <div className="stat-label">Soporte</div>
                </div>
            </div>

            <section className="downloads animate-on-scroll">
                <h2>Descarga Nuestras Apps</h2>
                <p>Instala FASTNET TV en todos tus dispositivos y disfruta donde quieras, cuando quieras. Descarga gratuita y configuración automática.</p>
                <div className="download-buttons">
                    <a href="https://files.fastnetperu.com.pe/software/iptvstreamplayer_fastnetperu.apk" className="download-btn animate-slide-left animate-delay-1" target="_blank" rel="noopener noreferrer">
                        <span className="download-icon">📱</span>
                        <span className="download-text">Descargar para Celular</span>
                    </a>
                    <a href="https://files.fastnetperu.com.pe/software/FASTNET-TV.apk" className="download-btn animate-slide-right animate-delay-2" target="_blank" rel="noopener noreferrer">
                        <span className="download-icon">📺</span>
                        <span className="download-text">Descargar para Android TV</span>
                    </a>
                </div>
            </section>

            <section className="plans-section animate-on-scroll">
                <h2>Nuestros Planes</h2>
                <div className="plans">
                    <div className="plan-card animate-slide-left animate-delay-1">
                        <div className="plan-header">
                            <div className="plan-name">Básico</div>
                            <div className="plan-price-container">
                                <div className="plan-price">10</div>
                                <div className="plan-currency">Soles / Mes</div>
                            </div>
                        </div>
                        <ul className="plan-features">
                            <li>150+ Canales HD</li>
                            <li>Películas Recientes</li>
                            <li>Series Completas</li>
                            <li>Contenido Nacional</li>
                            <li>Calidad HD</li>
                            <li>Soporte 24/7</li>
                        </ul>
                    </div>
                    <div className="plan-card premium animate-slide-right animate-delay-2">
                        <div className="plan-header">
                            <div className="plan-name">Premium</div>
                            <div className="plan-price-container">
                                <div className="plan-price">15</div>
                                <div className="plan-currency">Soles / Mes</div>
                            </div>
                        </div>
                        <ul className="plan-features">
                            <li>Todo del Plan Básico</li>
                            <li>Estrenos de Cine</li>
                            <li>Calidad 4K Ultra HD</li>
                            <li>Múltiples Dispositivos</li>
                            <li>Sin Publicidad</li>
                            <li>Contenido Exclusivo</li>
                        </ul>
                    </div>
                </div>
            </section>

            <section className="testimonials animate-on-scroll">
                <h2>Lo que dicen nuestros clientes</h2>
                <div className="testimonials-grid">
                    <div className="testimonial animate-on-scroll animate-delay-1">
                        <div className="testimonial-text">"Excelente servicio, nunca se corta y tiene todas las películas nuevas. Lo recomiendo 100%."</div>
                        <div className="testimonial-author">- María González</div>
                    </div>
                    <div className="testimonial animate-on-scroll animate-delay-2">
                        <div className="testimonial-text">"La calidad es increíble y el precio muy accesible. Perfecto para toda la familia."</div>
                        <div className="testimonial-author">- Carlos Mendoza</div>
                    </div>
                    <div className="testimonial animate-on-scroll animate-delay-3">
                        <div className="testimonial-text">"Fácil de instalar y usar. Tengo todos mis canales favoritos en un solo lugar."</div>
                        <div className="testimonial-author">- Ana Rodríguez</div>
                    </div>
                </div>
            </section>

            <section className="features animate-on-scroll">
                <h2>¿Por qué elegir FASTNET TV?</h2>
                <div className="features-grid">
                    <div className="feature-item animate-on-scroll animate-delay-1">
                        <div className="feature-icon">📺</div>
                        <div className="feature-title">Contenido Completo</div>
                        <div className="feature-description">Canales en vivo, películas recién estrenadas y series completas en un solo lugar</div>
                    </div>
                    <div className="feature-item animate-on-scroll animate-delay-2">
                        <div className="feature-icon">🌐</div>
                        <div className="feature-title">Acceso Global</div>
                        <div className="feature-description">Contenido internacional de todos los países con la mejor calidad</div>
                    </div>
                    <div className="feature-item animate-on-scroll animate-delay-3">
                        <div className="feature-icon">📱</div>
                        <div className="feature-title">Multi-Dispositivo</div>
                        <div className="feature-description">Compatible con teléfonos, tablets, Smart TV y Android TV</div>
                    </div>
                    <div className="feature-item animate-on-scroll animate-delay-4">
                        <div className="feature-icon">⚡</div>
                        <div className="feature-title">Sin Interrupciones</div>
                        <div className="feature-description">Tecnología de streaming estable para una experiencia perfecta</div>
                    </div>
                    <div className="feature-item animate-on-scroll animate-delay-5">
                        <div className="feature-icon">🎬</div>
                        <div className="feature-title">Estrenos Recientes</div>
                        <div className="feature-description">Las últimas películas de cine disponibles al instante</div>
                    </div>
                    <div className="feature-item animate-on-scroll animate-delay-6">
                        <div className="feature-icon">💰</div>
                        <div className="feature-title">Precio Accesible</div>
                        <div className="feature-description">El mejor entretenimiento al precio más económico del mercado</div>
                    </div>
                </div>
            </section>
        </div>

        <footer className="animate-on-scroll">
            <p>&copy; 2024 FASTNET TV. Todos los derechos reservados. | Servicio IPTV Premium con Películas y Series</p>
        </footer>
    </>
  );
}

export default App;
