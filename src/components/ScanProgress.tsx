
import { Progress } from "@/components/ui/progress";
import { ScanProgress as ScanProgressType } from "@/types/scan";
import { Loader2, Shield, Search, Brain } from "lucide-react";

interface ScanProgressProps {
  progress: ScanProgressType;
}

export const ScanProgress = ({ progress }: ScanProgressProps) => {
  const getIcon = () => {
    if (progress.progress < 30) return <Search className="h-6 w-6 animate-spin" />;
    if (progress.progress < 70) return <Shield className="h-6 w-6 animate-pulse" />;
    if (progress.progress < 90) return <Brain className="h-6 w-6 animate-bounce" />;
    return <Loader2 className="h-6 w-6 animate-spin" />;
  };

  return (
    <div className="space-y-4 p-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border">
      <div className="flex items-center space-x-3">
        {getIcon()}
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900">{progress.stage}</h3>
          <p className="text-sm text-gray-600">{progress.message}</p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-blue-600">{progress.progress}%</div>
        </div>
      </div>
      
      <Progress value={progress.progress} className="h-3" />
      
      <div className="text-xs text-gray-500 text-center">
        Scanning for exposed API keys and security vulnerabilities...
      </div>
    </div>
  );
};
