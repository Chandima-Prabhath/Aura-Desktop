import { useState, useEffect, useMemo } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trash2, Plus, Save, Sun, Moon, Search, X, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { ProjectSettings } from "./ProjectSettings";

interface I18nFile {
    name: string;
    path: string;
    content: Record<string, any>;
}

interface FlatTranslation {
    key: string;
    [fileName: string]: string;
}

interface TranslationManagerProps {
    initialPath?: string;
    isDarkMode: boolean;
    toggleTheme: () => void;
}

export function TranslationManager({ initialPath, isDarkMode, toggleTheme }: TranslationManagerProps) {
    // Persistence: Load initial state from localStorage
    const [dirPath, setDirPath] = useState(() => {
        if (initialPath) return initialPath;
        return localStorage.getItem("tm_dirPath") || "D:\\RD\\tauri-dekstop\\i18n\\locales";
    });
    const [files, setFiles] = useState<I18nFile[]>([]);
    const [translations, setTranslations] = useState<FlatTranslation[]>([]);
    const [loading, setLoading] = useState(false);

    // QoL State
    const [searchQuery, setSearchQuery] = useState("");

    // Enhancements State
    const [hiddenColumns, setHiddenColumns] = useState<Set<string>>(() => {
        const saved = localStorage.getItem("tm_hiddenColumns");
        return saved ? new Set(JSON.parse(saved)) : new Set();
    });
    const [newLangCode, setNewLangCode] = useState("");
    const [showAddLang, setShowAddLang] = useState(false);
    const [newKeyName, setNewKeyName] = useState("");
    const [showAddKey, setShowAddKey] = useState(false);

    useEffect(() => {
        if (initialPath) {
            setDirPath(initialPath);
        }
    }, [initialPath]);

    // Persistence Effects
    useEffect(() => {
        localStorage.setItem("tm_dirPath", dirPath);
    }, [dirPath]);

    useEffect(() => {
        localStorage.setItem("tm_hiddenColumns", JSON.stringify(Array.from(hiddenColumns)));
    }, [hiddenColumns]);

    // Keyboard Shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault();
                saveFiles();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [files, translations]); // Dependencies needed for saveFiles closure

    const flattenObject = (obj: Record<string, any>, prefix = ""): Record<string, string> => {
        return Object.keys(obj).reduce((acc: Record<string, string>, k) => {
            const pre = prefix.length ? prefix + "." : "";
            if (typeof obj[k] === "object" && obj[k] !== null) {
                Object.assign(acc, flattenObject(obj[k], pre + k));
            } else {
                acc[pre + k] = obj[k];
            }
            return acc;
        }, {});
    };

    const unflattenObject = (data: Record<string, string>): Record<string, any> => {
        const result: Record<string, any> = {};
        for (const i in data) {
            const keys = i.split(".");
            keys.reduce((r, e, j) => {
                return r[e] || (r[e] = keys.length - 1 === j ? data[i] : {});
            }, result);
        }
        return result;
    };

    const loadFiles = async (pathOverride?: string) => {
        const path = pathOverride || dirPath;
        setLoading(true);
        try {
            const loadedFiles = await invoke<I18nFile[]>("read_i18n_files", { dirPath: path });
            setFiles(loadedFiles);

            const allKeys = new Set<string>();
            const fileContents: Record<string, Record<string, string>> = {};

            loadedFiles.forEach(file => {
                const flat = flattenObject(file.content);
                fileContents[file.name] = flat;
                Object.keys(flat).forEach(k => allKeys.add(k));
            });

            const tableData: FlatTranslation[] = Array.from(allKeys).sort().map(key => {
                const row: FlatTranslation = { key };
                loadedFiles.forEach(file => {
                    row[file.name] = fileContents[file.name][key] || "";
                });
                return row;
            });

            setTranslations(tableData);
            toast.success(`Loaded ${loadedFiles.length} files.`);
        } catch (error) {
            console.error(error);
            toast.error(`Error loading files: ${error}`);
        } finally {
            setLoading(false);
        }
    };

    // Auto-load when initialPath changes and is valid
    useEffect(() => {
        if (initialPath) {
            loadFiles(initialPath);
        }
    }, [initialPath]);

    const handleEdit = (key: string, fileName: string, value: string) => {
        setTranslations(prev => prev.map(row => {
            if (row.key === key) {
                return { ...row, [fileName]: value };
            }
            return row;
        }));
    };

    const saveFiles = async () => {
        setLoading(true);
        const toastId = toast.loading("Saving files...");
        try {
            for (const file of files) {
                const newContent: Record<string, string> = {};
                translations.forEach(row => {
                    if (row[file.name] !== undefined) {
                        newContent[row.key] = row[file.name];
                    }
                });
                const unflattened = unflattenObject(newContent);
                await invoke("save_i18n_file", { filePath: file.path, content: unflattened });
            }
            toast.success("All files saved successfully!", { id: toastId });
        } catch (error) {
            console.error(error);
            toast.error(`Error saving: ${error}`, { id: toastId });
        } finally {
            setLoading(false);
        }
    };

    const handleCreateFile = async () => {
        if (!newLangCode) return;
        try {
            const fileName = `${newLangCode}.json`;
            const filePath = `${dirPath}\\${fileName}`;
            await invoke("create_i18n_file", { filePath });

            const indexPath = dirPath.replace(/\\locales$/, "\\index.ts");
            await invoke("add_lang_to_index", { indexPath, langCode: newLangCode });

            // In-memory update to prevent data loss
            const newFile: I18nFile = {
                name: fileName,
                path: filePath,
                content: {}
            };

            setFiles(prev => [...prev, newFile]);
            setTranslations(prev => prev.map(row => ({
                ...row,
                [fileName]: ""
            })));

            setNewLangCode("");
            setShowAddLang(false);
            toast.success(`Created ${fileName}`);
        } catch (error) {
            toast.error(`Error creating file: ${error}`);
        }
    };

    const handleDeleteFile = async (fileName: string, filePath: string) => {
        if (!confirm(`Are you sure you want to delete ${fileName}? This cannot be undone.`)) return;
        try {
            await invoke("delete_i18n_file", { filePath });

            const langCode = fileName.replace(".json", "");
            const indexPath = dirPath.replace(/\\locales$/, "\\index.ts");
            await invoke("remove_lang_from_index", { indexPath, langCode });

            // In-memory update
            setFiles(prev => prev.filter(f => f.name !== fileName));
            setTranslations(prev => prev.map(row => {
                const newRow = { ...row };
                delete newRow[fileName];
                return newRow;
            }));

            toast.success(`Deleted ${fileName}`);
        } catch (error) {
            toast.error(`Error deleting file: ${error}`);
        }
    };

    const handleAddKey = () => {
        if (!newKeyName) return;
        if (translations.some(t => t.key === newKeyName)) {
            toast.error("Key already exists!");
            return;
        }
        const newRow: FlatTranslation = { key: newKeyName };
        files.forEach(f => newRow[f.name] = "");
        setTranslations(prev => [newRow, ...prev]);
        setNewKeyName("");
        setShowAddKey(false);
        toast.success(`Added key: ${newKeyName}`);
    };

    const handleDeleteKey = (key: string) => {
        if (confirm(`Are you sure you want to delete key "${key}"?`)) {
            setTranslations(prev => prev.filter(row => row.key !== key));
            toast.success(`Deleted key: ${key}`);
        }
    };

    const toggleColumn = (fileName: string) => {
        const newHidden = new Set(hiddenColumns);
        if (newHidden.has(fileName)) {
            newHidden.delete(fileName);
        } else {
            newHidden.add(fileName);
        }
        setHiddenColumns(newHidden);
    };

    // Filtered Data
    const filteredTranslations = useMemo(() => {
        if (!searchQuery) return translations;
        const lowerQuery = searchQuery.toLowerCase();
        return translations.filter(row =>
            row.key.toLowerCase().includes(lowerQuery) ||
            files.some(f => (row[f.name] || "").toLowerCase().includes(lowerQuery))
        );
    }, [translations, searchQuery, files]);

    // Statistics
    const stats = useMemo(() => {
        if (files.length === 0) return [];
        return files.map(file => {
            const total = translations.length;
            const filled = translations.filter(row => row[file.name] && row[file.name].trim() !== "").length;
            const percent = total === 0 ? 0 : Math.round((filled / total) * 100);
            return { name: file.name, percent };
        });
    }, [files, translations]);

    return (
        <Card className="w-full h-full flex flex-col relative overflow-hidden border-none shadow-2xl bg-card/50 backdrop-blur-xl">
            <CardHeader className="pb-4 space-y-4 px-6 pt-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" onClick={() => window.location.reload()} className="hover:bg-muted/50 rounded-full">
                            <ArrowLeft className="w-5 h-5" />
                        </Button>
                        <CardTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                            Sylvy Editor
                        </CardTitle>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="ghost" size="icon" onClick={toggleTheme} className="rounded-full">
                            {isDarkMode ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => setShowAddKey(!showAddKey)} className="bg-background/50 backdrop-blur-sm">
                            <Plus className="w-4 h-4 mr-2" /> Key
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => setShowAddLang(!showAddLang)} className="bg-background/50 backdrop-blur-sm">
                            <Plus className="w-4 h-4 mr-2" /> Language
                        </Button>

                        <ProjectSettings
                            dirPath={dirPath}
                            onDirPathChange={(path) => {
                                setDirPath(path);
                                loadFiles(path);
                            }}
                            files={files}
                            hiddenColumns={hiddenColumns}
                            onToggleColumn={toggleColumn}
                        />

                        <Button onClick={saveFiles} disabled={loading || files.length === 0} variant="default" className="shadow-lg shadow-primary/20">
                            <Save className="w-4 h-4 mr-2" /> Save All
                        </Button>
                    </div>
                </div>

                {/* Statistics Bar */}
                {stats.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex gap-4 text-xs text-muted-foreground overflow-x-auto pb-2 scrollbar-hide"
                    >
                        {stats.map(s => (
                            <div key={s.name} className="flex items-center gap-2 whitespace-nowrap bg-muted/30 border border-border/50 px-2 py-1 rounded-full backdrop-blur-sm">
                                <span className="font-medium">{s.name}</span>
                                <div className="w-12 h-1.5 bg-muted rounded-full overflow-hidden">
                                    <div className={`h-full transition-all duration-500 ${s.percent === 100 ? 'bg-green-500' : s.percent > 50 ? 'bg-blue-500' : 'bg-yellow-500'}`} style={{ width: `${s.percent}%` }} />
                                </div>
                                <span>{s.percent}%</span>
                            </div>
                        ))}
                    </motion.div>
                )}

                {/* Inputs Area */}
                <AnimatePresence>
                    {showAddLang && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="flex gap-2 items-center bg-muted/30 p-2 rounded-md overflow-hidden border border-border/50"
                        >
                            <Input
                                placeholder="Language code (e.g. es, de)"
                                value={newLangCode}
                                onChange={e => setNewLangCode(e.target.value)}
                                className="h-8 w-48 bg-background/50"
                            />
                            <Button size="sm" onClick={handleCreateFile}>Create</Button>
                            <Button size="sm" variant="ghost" onClick={() => setShowAddLang(false)}><X className="w-4 h-4" /></Button>
                        </motion.div>
                    )}

                    {showAddKey && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="flex gap-2 items-center bg-muted/30 p-2 rounded-md overflow-hidden border border-border/50"
                        >
                            <Input
                                placeholder="Key name (e.g. common.submit)"
                                value={newKeyName}
                                onChange={e => setNewKeyName(e.target.value)}
                                className="h-8 w-64 bg-background/50"
                            />
                            <Button size="sm" onClick={handleAddKey}>Add</Button>
                            <Button size="sm" variant="ghost" onClick={() => setShowAddKey(false)}><X className="w-4 h-4" /></Button>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Search Filter */}
                {files.length > 0 && (
                    <div className="relative">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search keys or translations..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9 bg-background/50 border-border/50 focus:bg-background transition-colors"
                        />
                    </div>
                )}

            </CardHeader>
            <CardContent className="space-y-4 flex-1 flex flex-col min-h-0 px-0 pb-0">
                {filteredTranslations.length > 0 ? (
                    <div className="overflow-auto flex-1">
                        <table className="w-full text-sm text-left relative border-collapse">
                            <thead className="bg-muted/30 text-muted-foreground sticky top-0 z-10 backdrop-blur-md border-b border-border/50">
                                <tr>
                                    <th className="p-3 font-medium w-10"></th>
                                    <th className="p-3 font-medium min-w-[200px]">Key</th>
                                    {files.filter(f => !hiddenColumns.has(f.name)).map(file => (
                                        <th key={file.name} className="p-3 font-medium min-w-[200px]">
                                            <div className="flex items-center justify-between group/header">
                                                {file.name}
                                                <button onClick={() => handleDeleteFile(file.name, file.path)} className="opacity-0 group-hover/header:opacity-100 transition-opacity text-destructive hover:bg-destructive/10 p-1 rounded">
                                                    <Trash2 className="w-3 h-3" />
                                                </button>
                                            </div>
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/30">
                                {filteredTranslations.map((row) => (
                                    <motion.tr
                                        layout
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        key={row.key}
                                        className="hover:bg-muted/20 group transition-colors"
                                    >
                                        <td className="p-2 text-center">
                                            <button onClick={() => handleDeleteKey(row.key)} className="opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:bg-destructive/10 p-1 rounded">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </td>
                                        <td className="p-2 font-mono text-xs font-medium text-muted-foreground select-text">{row.key}</td>
                                        {files.filter(f => !hiddenColumns.has(f.name)).map(file => (
                                            <td key={`${row.key}-${file.name}`} className="p-1">
                                                <input
                                                    className={`w-full bg-transparent p-2 rounded hover:bg-background/50 focus:bg-background focus:ring-1 focus:ring-ring outline-none transition-all ${!row[file.name] ? 'bg-red-50/30 dark:bg-red-900/10' : ''}`}
                                                    value={row[file.name] || ""}
                                                    onChange={(e) => handleEdit(row.key, file.name, e.target.value)}
                                                />
                                            </td>
                                        ))}
                                    </motion.tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    files.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="text-center text-muted-foreground py-12 flex flex-col items-center gap-2"
                        >
                            <Search className="w-8 h-8 opacity-20" />
                            <p>No translations found matching your search.</p>
                        </motion.div>
                    )
                )}
            </CardContent>
        </Card>
    );
}
