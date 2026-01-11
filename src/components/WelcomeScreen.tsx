import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { FolderOpen, Plus, Sun, Moon } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { open } from '@tauri-apps/plugin-dialog';
import { invoke } from "@tauri-apps/api/core";
import { toast } from "sonner";

interface WelcomeScreenProps {
    onOpenProject: (path: string) => void;
    onNewProject: (path: string) => void;
    isDarkMode: boolean;
    toggleTheme: () => void;
}

export function WelcomeScreen({ onOpenProject, onNewProject, isDarkMode, toggleTheme }: WelcomeScreenProps) {
    const [loading, setLoading] = useState(false);

    const handleOpenClick = async () => {
        try {
            const selected = await open({
                directory: true,
                multiple: false,
                title: "Select Project Directory"
            });

            if (selected && typeof selected === 'string') {
                onOpenProject(selected);
            }
        } catch (error) {
            console.error(error);
            toast.error("Failed to open directory picker");
        }
    };

    const handleNewClick = async () => {
        try {
            const selected = await open({
                directory: true,
                multiple: false,
                title: "Select Directory for New Project"
            });

            if (selected && typeof selected === 'string') {
                setLoading(true);
                try {
                    await invoke('initialize_project', { dirPath: selected });
                    toast.success("Project initialized successfully!");
                    onNewProject(selected);
                } catch (err) {
                    console.error(err);
                    toast.error(`Failed to initialize project: ${err}`);
                } finally {
                    setLoading(false);
                }
            }
        } catch (error) {
            console.error(error);
            toast.error("Failed to open directory picker");
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4 relative">
            <div className="absolute top-4 right-4">
                <Button variant="ghost" size="icon" onClick={toggleTheme} className="rounded-full">
                    {isDarkMode ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
                </Button>
            </div>
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="max-w-md w-full"
            >
                <Card className="border-none shadow-2xl bg-card/50 backdrop-blur-xl">
                    <CardHeader className="text-center space-y-4 pb-8">
                        <motion.div
                            initial={{ y: -20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            className="space-y-2"
                        >
                            <CardTitle className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">Sylvy</CardTitle>
                            <CardDescription className="text-base">
                                Manage your i18n files with ease and precision.
                            </CardDescription>
                        </motion.div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <motion.div
                            initial={{ x: -20, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            transition={{ delay: 0.3 }}
                        >
                            <Button
                                size="lg"
                                className="w-full h-14 text-lg justify-start px-6 hover:scale-[1.02] transition-transform shadow-lg shadow-primary/20"
                                onClick={handleOpenClick}
                                disabled={loading}
                            >
                                <FolderOpen className="mr-3 w-6 h-6" />
                                Open Existing Project
                            </Button>
                        </motion.div>

                        <motion.div
                            initial={{ x: 20, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            transition={{ delay: 0.4 }}
                        >
                            <Button
                                size="lg"
                                variant="outline"
                                className="w-full h-14 text-lg justify-start px-6 hover:scale-[1.02] transition-transform hover:bg-secondary/50 bg-background/50 backdrop-blur-sm"
                                onClick={handleNewClick}
                                disabled={loading}
                            >
                                <Plus className="mr-3 w-6 h-6" />
                                Start New Project
                            </Button>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.6 }}
                            className="pt-6 text-center text-xs text-muted-foreground"
                        >
                            v1.0.0 • Built with Tauri & React
                        </motion.div>
                    </CardContent>
                </Card>
            </motion.div>
        </div>
    );
}
