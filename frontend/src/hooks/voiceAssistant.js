import { useState, useEffect, useRef } from 'react';

export const VoiceAssistant = (onAutoCalculate) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const recognitionRef = useRef(null);

 
  const speak = (text) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      utterance.volume = 0.8;
      
      const voices = window.speechSynthesis.getVoices();
      const femaleVoice = voices.find(voice => 
        voice.name.includes('Female') || voice.name.includes('Karen') || voice.name.includes('Samantha')
      );
      if (femaleVoice) {
        utterance.voice = femaleVoice;
      }
      
      window.speechSynthesis.speak(utterance);
    }
  };

 
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      
      if (!SpeechRecognition) {
        setError('Speech recognition not supported in this browser');
        return;
      }

      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event) => {
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          }
        }
        if (finalTranscript) {
          setTranscript(finalTranscript);
          processVoiceCommand(finalTranscript);
        }
      };

      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setError(`Speech recognition error: ${event.error}`);
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

 
  const processVoiceCommand = async (command) => {
    setIsProcessing(true);
    setError('');

    try {
      const processedCommand = await parseVoiceCommand(command);
      
      
      
      switch (processedCommand.type) {
        case 'ride':
          speak(`Booking a ${processedCommand.vehicle_type} ride to ${processedCommand.dropoff_address}. Calculating the best route and fare for you now.`);
          break;
        case 'courier':
          speak(`Sending a ${processedCommand.package_description} to ${processedCommand.dropoff_address}. Calculating delivery route and pricing now.`);
          break;
        case 'boda':
          speak(`Booking a boda ride to ${processedCommand.dropoff_address}. Finding the fastest route and calculating your fare.`);
          break;
        default:
          speak("Processing your request and calculating the route now.");
      }

      
      setTimeout(() => {
        if (onAutoCalculate) {
          onAutoCalculate(processedCommand);
        }
      }, 2000); 
      
      return processedCommand;
    } catch (err) {
      const errorMessage = err.message || 'Failed to process voice command';
      setError(errorMessage);
      speak(`Sorry, ${errorMessage.toLowerCase()}`);
    } finally {
      setIsProcessing(false);
    }
  };

 
  const startListening = () => {
    if (recognitionRef.current && !isListening) {
      setTranscript('');
      setError('');
      recognitionRef.current.start();
      setIsListening(true);
      speak("I'm listening. Tell me where you want to go and I'll handle everything automatically.");
    }
  };

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  };

  return {
    isListening,
    transcript,
    isProcessing,
    error,
    startListening,
    stopListening,
    processVoiceCommand,
    speak
  };
};


const parseVoiceCommand = async (command) => {
  const lowerCommand = command.toLowerCase().trim();
  
  if (lowerCommand.includes('ride') || lowerCommand.includes('cab') || lowerCommand.includes('taxi')) {
    return parseRideRequest(lowerCommand);
  }
  
  if (lowerCommand.includes('courier') || lowerCommand.includes('delivery') || lowerCommand.includes('package')) {
    return parseCourierRequest(lowerCommand);
  }
  
  if (lowerCommand.includes('boda') || lowerCommand.includes('motorcycle')) {
    return parseBodaRequest(lowerCommand);
  }
  
  throw new Error('Sorry, I didn\'t understand that. Try saying "I need a ride to [location]" or "I want to send a package to [address]"');
};

const parseRideRequest = (command) => {
  const destinations = extractLocation(command);
  
  if (!destinations.to) {
    throw new Error('Please specify where you want to go. Example: "I need a ride to Nairobi CBD"');
  }

  return {
    type: 'ride',
    pickup_address: 'Current Location',
    dropoff_address: destinations.to,
    vehicle_type: getVehicleTypeFromCommand(command),
    service_type: 'ride'
  };
};

const parseCourierRequest = (command) => {
  const destinations = extractLocation(command);
  
  if (!destinations.to) {
    throw new Error('Please specify the delivery address. Example: "I need a courier to Westlands"');
  }

  return {
    type: 'courier',
    pickup_address: 'Current Location',
    dropoff_address: destinations.to,
    vehicle_type: getVehicleTypeFromCommand(command, true),
    service_type: 'courier',
    package_description: extractPackageDescription(command)
  };
};

const parseBodaRequest = (command) => {
  const destinations = extractLocation(command);
  
  if (!destinations.to) {
    throw new Error('Please specify where you want to go. Example: "I need a boda to the mall"');
  }

  return {
    type: 'boda',
    pickup_address: 'Current Location',
    dropoff_address: destinations.to,
    vehicle_type: 'boda',
    service_type: 'ride'
  };
};


const extractLocation = (command) => {
  const toKeywords = ['to', 'towards', 'for', 'at'];
  let toLocation = '';
  
  for (const keyword of toKeywords) {
    const regex = new RegExp(`${keyword}\\s+([^,.!?]+)`, 'i');
    const match = command.match(regex);
    if (match) {
      toLocation = match[1].trim();
      break;
    }
  }
  
 
  
  const nairobiLocations = [
    'nairobi cbd', 'westlands', 'karen', 'langata', 'airport', 'jkia',
    'mombasa road', 'thika road', 'ngong road', 'kileleshwa', 'lavington',
    'parklands', 'kilimani', 'kasarani', 'ruaka', 'rongai'
  ];
  
  if (!toLocation) {
    for (const location of nairobiLocations) {
      if (command.includes(location)) {
        toLocation = location;
        break;
      }
    }
  }
  
  return { to: toLocation };
};

const getVehicleTypeFromCommand = (command, isCourier = false) => {
  if (isCourier) {
    if (command.includes('car')) return 'courier_car';
    if (command.includes('bike') || command.includes('boda')) return 'courier_bike';
    return 'courier_bike'; 
    
  }
  
  if (command.includes('premium') || command.includes('comfort')) return 'premium';
  if (command.includes('boda') || command.includes('motorcycle')) return 'boda';
  if (command.includes('xl') || command.includes('suv')) return 'xl';
  return 'economy'; 
};

const extractPackageDescription = (command) => {
  if (command.includes('document')) return 'Documents';
  if (command.includes('food')) return 'Food delivery';
  if (command.includes('parcel')) return 'Parcel';
  if (command.includes('grocery')) return 'Groceries';
  return 'Package';
};


export default VoiceAssistant;