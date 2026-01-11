import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Settings, Eye, EyeOff, FolderOpen } from "lucide-react";
import { useState } from "react";
import { open } from '@tauri-apps/plugin-dialog';
import { toast } from "sonner";

interface ProjectSettingsProps {
    dirPath: string;
    onDirPathChange: (path: string) => void;
    files: { name: string }[];
    hiddenColumns: Set<string>;
    onToggleColumn: (fileName: string) => void;
}

export function ProjectSettings({
    dirPath,
    onDirPathChange,
    files,
    hiddenColumns,
    onToggleColumn,
}: ProjectSettingsProps) {
    const [openDialog, setOpenDialog] = useState(false);

    const handleBrowse = async () => {
        try {
            const selected = await open({
                directory: true,
                multiple: false,
                title: "Select i18n Directory",
                defaultPath: dirPath,
            });
            if (selected && typeof selected === 'string') {
                onDirPathChange(selected);
                toast.success("Project path updated");
            }
        } catch (error) {
            console.error(error);
            toast.error("Failed to open directory picker");
        }
    };

    return (
        <Dialog open={openDialog} onOpenChange={setOpenDialog}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                    <Settings className="w-4 h-4 mr-2" />
                    Settings
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] bg-card/95 backdrop-blur-xl border-border/50">
                <DialogHeader>
                    <DialogTitle>Project Settings</DialogTitle>
                    <DialogDescription>
                        Manage your project configuration and view preferences.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="project-path">Project Path</Label>
                        <div className="flex gap-2">
                            <Input
                                id="project-path"
                                value={dirPath}
                                readOnly
                                className="col-span-3 font-mono text-xs bg-muted/50"
                            />
                            <Button size="icon" variant="outline" onClick={handleBrowse}>
                                <FolderOpen className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>

                    <div className="grid gap-2">
                        <Label>Visible Languages</Label>
                        <div className="border rounded-md p-2 max-h-[200px] overflow-y-auto space-y-1 bg-muted/20">
                            {files.length === 0 ? (
                                <div className="text-sm text-muted-foreground text-center py-4">
                                    No language files found.
                                </div>
                            ) : (
                                files.map((file) => (
                                    <div
                                        key={file.name}
                                        className="flex items-center justify-between p-2 hover:bg-muted/50 rounded-md cursor-pointer transition-colors"
                                        onClick={() => onToggleColumn(file.name)}
                                    >
                                        <span className={`text-sm ${hiddenColumns.has(file.name) ? 'text-muted-foreground line-through' : ''}`}>
                                            {file.name}
                                        </span>
                                        {hiddenColumns.has(file.name) ? (
                                            <EyeOff className="w-4 h-4 text-muted-foreground" />
                                        ) : (
                                            <Eye className="w-4 h-4 text-primary" />
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
