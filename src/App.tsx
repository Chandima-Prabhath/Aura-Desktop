import { useState, useEffect } from "react";
import { TranslationManager } from "@/components/TranslationManager";
import { WelcomeScreen } from "@/components/WelcomeScreen";
import { Toaster } from "sonner";
import { AnimatePresence, motion } from "framer-motion";

type View = 'welcome' | 'editor';

function App() {
  const [currentView, setCurrentView] = useState<View>('welcome');
  const [projectPath, setProjectPath] = useState<string>("");

  // Theme State
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem("tm_theme") === "dark" || document.documentElement.classList.contains('dark');
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem("tm_theme", "dark");
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem("tm_theme", "light");
    }
  }, [isDarkMode]);

  const toggleTheme = () => setIsDarkMode(!isDarkMode);

  const handleOpenProject = (path: string) => {
    setProjectPath(path);
    setCurrentView('editor');
  };

  const handleNewProject = (path: string) => {
    setProjectPath(path);
    setCurrentView('editor');
  };

  return (
    <>
      <Toaster position="top-center" richColors theme={isDarkMode ? 'dark' : 'light'} />
      <div className="min-h-screen bg-background text-foreground font-sans antialiased overflow-hidden transition-colors duration-300">
        <AnimatePresence mode="wait">
          {currentView === 'welcome' ? (
            <motion.div
              key="welcome"
              exit={{ opacity: 0, y: -20, filter: "blur(10px)" }}
              transition={{ duration: 0.4, ease: "easeInOut" }}
              className="absolute inset-0"
            >
              <WelcomeScreen
                onOpenProject={handleOpenProject}
                onNewProject={handleNewProject}
                isDarkMode={isDarkMode}
                toggleTheme={toggleTheme}
              />
            </motion.div>
          ) : (
            <motion.div
              key="editor"
              initial={{ opacity: 0, y: 20, filter: "blur(10px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="absolute inset-0 flex flex-col items-center p-4 md:p-8"
            >
              <div className="max-w-[1600px] w-full h-full space-y-6 flex flex-col">
                <TranslationManager
                  initialPath={projectPath}
                  isDarkMode={isDarkMode}
                  toggleTheme={toggleTheme}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}

export default App;
