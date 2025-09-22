import React, { useState, useEffect } from 'react';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useLocation } from 'wouter';
import { 
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

// Define commands that the voice assistant can understand
const commands = [
  {
    command: ['Go to home', 'Dashboard', 'Show dashboard'],
    callback: (navigate: Function) => navigate('/'),
    description: 'Navigate to the dashboard'
  },
  {
    command: ['Go to appointments', 'Show appointments', 'Appointments', 'My appointments'],
    callback: (navigate: Function) => navigate('/appointments'),
    description: 'Navigate to appointments page'
  },
  {
    command: ['Show doctors', 'Find doctors', 'Search doctors', 'Doctors'],
    callback: (navigate: Function) => navigate('/doctors'),
    description: 'Navigate to doctors page'
  },
  {
    command: ['Show hospitals', 'Find hospitals', 'Search hospitals', 'Hospitals'],
    callback: (navigate: Function) => navigate('/hospitals'),
    description: 'Navigate to hospitals page'
  },
  {
    command: ['Show medical records', 'My records', 'Medical records'],
    callback: (navigate: Function) => navigate('/medical-records'),
    description: 'Navigate to medical records page'
  },
  {
    command: ['Call doctor', 'Doctor visit', 'Home doctor', 'Book doctor visit'],
    callback: (navigate: Function) => navigate('/bring-doctor'),
    description: 'Navigate to home doctor visit page'
  },
  {
    command: ['First aid', 'Show first aid', 'First aid guide'],
    callback: (navigate: Function) => navigate('/first-aid'),
    description: 'Navigate to first aid guide'
  },
  {
    command: ['Diet', 'Diet routine', 'Food plan', 'Show diet'],
    callback: (navigate: Function) => navigate('/diet-routine'),
    description: 'Navigate to diet routine page'
  },
  {
    command: ['Medications', 'Show medications', 'My medications', 'Medicine tracker'],
    callback: (navigate: Function) => navigate('/medication-tracker'),
    description: 'Navigate to medication tracker page'
  },
  {
    command: ['Settings', 'Open settings', 'Show settings', 'My settings'],
    callback: (navigate: Function) => navigate('/settings'),
    description: 'Navigate to settings page'
  },
  {
    command: ['Help', 'What can I say', 'Show commands', 'Available commands'],
    callback: (_: any, setShowHelp: Function) => setShowHelp(true),
    description: 'Show available voice commands'
  },
  {
    command: ['Close help', 'Hide commands', 'Hide help'],
    callback: (_: any, setShowHelp: Function) => setShowHelp(false),
    description: 'Hide voice commands help'
  }
];

const VoiceAssistant: React.FC = () => {
  const [isListening, setIsListening] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const { toast } = useToast();
  const [, navigate] = useLocation();
  
  const {
    transcript,
    listening,
    resetTranscript,
    browserSupportsSpeechRecognition
  } = useSpeechRecognition({ 
    commands: commands.map(command => ({
      ...command,
      callback: () => command.callback(navigate, setShowHelp)
    }))
  });

  useEffect(() => {
    setIsListening(listening);
  }, [listening]);

  if (!browserSupportsSpeechRecognition) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={() => {
          toast({
            title: "Voice Assistant Unavailable",
            description: "Your browser doesn't support speech recognition.",
            variant: "destructive"
          });
        }}
        className="group relative"
      >
        <span className="sr-only">Voice Assistant</span>
        <i className="ri-mic-off-line text-lg"></i>
      </Button>
    );
  }

  const toggleListening = () => {
    if (isListening) {
      SpeechRecognition.stopListening();
      resetTranscript();
    } else {
      SpeechRecognition.startListening({ continuous: true });
      toast({
        title: "Voice Assistant Activated",
        description: "Try saying 'What can I say' for help",
        duration: 3000
      });
    }
  };

  return (
    <Popover open={showHelp} onOpenChange={setShowHelp}>
      <PopoverTrigger asChild>
        <Button
          variant={isListening ? "default" : "outline"}
          size="sm"
          onClick={toggleListening}
          className={`group relative ${isListening ? 'animate-pulse bg-primary hover:bg-primary' : ''}`}
        >
          <span className="sr-only">Voice Assistant</span>
          <i className={`${isListening ? 'ri-mic-fill text-white' : 'ri-mic-line'} text-lg`}></i>
          {listening && (
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-4">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Voice Commands</h3>
            {isListening && (
              <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                Listening
              </span>
            )}
          </div>
          
          {transcript && (
            <div className="p-2 bg-gray-100 rounded-md text-sm">
              <p className="font-semibold">I heard:</p>
              <p className="italic">{transcript}</p>
            </div>
          )}
          
          <ul className="space-y-2 list-disc pl-4 text-sm">
            {commands.map((command, index) => (
              <li key={index}>
                <span className="font-medium">{Array.isArray(command.command) ? command.command[0] : command.command}</span>
                <span className="text-gray-500 text-xs ml-1">- {command.description}</span>
              </li>
            ))}
          </ul>
          
          <div className="text-xs text-gray-500 pt-2 border-t border-gray-200">
            Tip: You can say "What can I say" anytime to see this help.
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default VoiceAssistant;