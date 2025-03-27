import Layout from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { 
  Accordion, 
  AccordionContent, 
  AccordionItem, 
  AccordionTrigger 
} from "@/components/ui/accordion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { 
  AlertTriangle,
  Search,
  Phone,
  RefreshCw,
  Heart,
  Thermometer,
  PanelRight,
  PanelLeft,
  Plus
} from "lucide-react";

// First aid common emergencies data
const firstAidGuides = [
  {
    id: "cpr",
    title: "CPR (Cardiopulmonary Resuscitation)",
    category: "critical",
    icon: "ri-heart-pulse-line",
    steps: [
      "Check the scene for safety and call emergency services immediately (108 in Bengaluru, India).",
      "Check if the person is responsive by tapping their shoulder and asking loudly if they're OK.",
      "If unresponsive, check for breathing (look, listen, feel for no more than 10 seconds).",
      "If not breathing or only gasping, begin CPR.",
      "Place the person on their back on a firm surface.",
      "Kneel beside the person's chest.",
      "Place the heel of one hand on the center of the chest, place your other hand on top, interlocking your fingers.",
      "Keep your arms straight, position your shoulders directly over your hands.",
      "Push hard and fast: compress at least 2 inches deep at a rate of 100-120 compressions per minute.",
      "Allow complete chest recoil after each compression.",
      "Minimize interruptions in compressions.",
      "Continue until emergency services arrive or the person shows signs of life."
    ],
    warning: "CPR can cause rib fractures. However, not performing CPR when needed can be fatal. It's better to perform CPR even if you're not sure it's needed than to withhold it when it is needed."
  },
  {
    id: "choking",
    title: "Choking",
    category: "critical",
    icon: "ri-capsule-line",
    steps: [
      "Ask, 'Are you choking?' If the person nods yes and cannot talk or is making high-pitched noises, they need help.",
      "Stand behind the person and place one foot slightly in front of the other for balance.",
      "Wrap your arms around their waist.",
      "Make a fist with one hand and place the thumb side against the middle of the person's abdomen, just above the navel.",
      "Grasp your fist with your other hand.",
      "Press into the abdomen with quick, upward thrusts.",
      "Repeat until the object is expelled or the person becomes unconscious.",
      "If the person becomes unconscious, carefully lower them to the ground and begin CPR, starting with chest compressions.",
      "If you see the object, remove it, then continue CPR if needed."
    ],
    warning: "For pregnant women or obese individuals, perform chest thrusts instead of abdominal thrusts."
  },
  {
    id: "bleeding",
    title: "Severe Bleeding",
    category: "critical",
    icon: "ri-drop-line",
    steps: [
      "Apply direct pressure on the wound with a clean cloth, gauze pad, or clothing.",
      "If blood soaks through, add additional material on top - do not remove the first layer.",
      "Maintain firm, continuous pressure for at least 15 minutes.",
      "If possible, elevate the wounded area above the level of the heart.",
      "If bleeding is from an arm or leg and continues despite direct pressure, apply pressure to the appropriate artery (brachial artery for arm or femoral artery for leg).",
      "If available, apply a tourniquet above the wound (closer to the torso) as a last resort for life-threatening bleeding that cannot be controlled by direct pressure.",
      "Secure the injured person to prevent movement that could restart bleeding.",
      "Get emergency medical help immediately."
    ],
    warning: "Only use a tourniquet as a last resort when bleeding cannot be controlled by other means. Once applied, a tourniquet should only be removed by medical professionals."
  },
  {
    id: "burns",
    title: "Burns",
    category: "urgent",
    icon: "ri-fire-line",
    steps: [
      "Remove the person from the source of the burn.",
      "For minor burns (redness, slight swelling): Cool the burn with cool (not cold) running water for 10-15 minutes.",
      "Remove jewelry or tight items from the burned area before swelling occurs.",
      "Cover the burn with a sterile, non-stick bandage or clean cloth.",
      "Do not apply butter, oil, ice, or fluffy cotton to the burn.",
      "Take over-the-counter pain relievers if needed.",
      "For severe burns (blistering, intense pain, white or charred appearance): Call emergency services immediately.",
      "Do not immerse large severe burns in water (can cause hypothermia).",
      "Elevate the burned area above heart level if possible.",
      "Cover the burn area with a cool, moist, sterile bandage or clean cloth."
    ],
    warning: "Do not break blisters, as this increases risk of infection. Seek medical attention for burns larger than 3 inches, or burns on the face, hands, feet, genitals, or over major joints."
  },
  {
    id: "fracture",
    title: "Fractures (Broken Bones)",
    category: "urgent",
    icon: "ri-surgical-knife-line",
    steps: [
      "Keep the injured person still and calm.",
      "If the person is bleeding, apply pressure to the wound with a sterile bandage or clean cloth.",
      "Immobilize the injured area in the position you found it.",
      "Apply a cold pack wrapped in a cloth to reduce swelling and pain.",
      "Treat for shock if necessary by laying the person flat, elevating the feet about 12 inches (if no head, neck, back or leg injuries), and covering them with a blanket.",
      "Do not move the person unless absolutely necessary.",
      "Do not attempt to realign the bone or push a protruding bone back in.",
      "For an open fracture (bone penetrating through skin), cover the wound with a clean, sterile dressing.",
      "Seek medical attention immediately."
    ],
    warning: "Never try to straighten a broken bone. Immobilize it as found. If you need to move the person, immobilize the joint above and below the fracture site first."
  },
  {
    id: "snake_bite",
    title: "Snake Bite",
    category: "critical",
    icon: "ri-scales-3-line",
    steps: [
      "Move the person away from the snake's striking distance.",
      "Call emergency services immediately (108 in Bengaluru, India).",
      "Keep the bitten area below the level of the heart to slow venom spread.",
      "Keep the person calm and still to reduce venom circulation.",
      "Remove any tight clothing, watches, or jewelry near the bite site before swelling starts.",
      "Clean the wound gently with soap and water if available.",
      "Cover the bite with a clean, dry dressing.",
      "Draw a circle around the edge of swelling/redness and mark the time. Repeat as swelling increases to monitor progression.",
      "If possible, try to remember the snake's appearance for identification (but do not attempt to capture or kill it).",
      "Transport the person to a hospital as quickly as possible."
    ],
    warning: "DO NOT cut the wound, attempt to suck out venom, apply a tourniquet, apply ice, give the person alcohol or caffeine, or attempt to catch the snake. These actions can cause more harm."
  },
  {
    id: "heart_attack",
    title: "Heart Attack",
    category: "critical",
    icon: "ri-heart-pulse-line",
    steps: [
      "Call emergency services immediately (108 in Bengaluru, India).",
      "Have the person sit down, rest, and try to keep calm.",
      "Loosen any tight clothing.",
      "If the person is not allergic to aspirin and it's readily available, give them an adult aspirin (325 mg) or a baby aspirin (81 mg) to chew and swallow.",
      "If the person is conscious, check if they have heart medication like nitroglycerin, and help them take it as prescribed.",
      "If the person becomes unresponsive and is not breathing normally, begin CPR.",
      "If an Automated External Defibrillator (AED) is available, use it following the device instructions.",
      "Monitor the person's condition until emergency medical help arrives."
    ],
    warning: "Many heart attacks start slowly with mild pain or discomfort. Common signs include: chest discomfort (pressure, squeezing, fullness), discomfort in other upper body areas (arms, back, neck, jaw, stomach), shortness of breath, and other signs like cold sweat, nausea, or lightheadedness."
  },
  {
    id: "stroke",
    title: "Stroke",
    category: "critical",
    icon: "ri-brain-line",
    steps: [
      "Use the FAST method to identify stroke symptoms: Face drooping? Arm weakness? Speech difficulty? Time to call emergency services!",
      "Note the time when symptoms first appeared (important for treatment decisions).",
      "Call emergency services immediately (108 in Bengaluru, India).",
      "Have the person lie down with their head slightly elevated.",
      "If the person is unconscious, put them in the recovery position: on their side with the head tilted back slightly to keep the airway open.",
      "Do not give the person anything to eat or drink.",
      "If the person is having difficulty breathing, loosen tight clothing.",
      "Monitor the person and be ready to perform CPR if they become unresponsive and aren't breathing normally.",
      "Reassure the person while waiting for emergency services."
    ],
    warning: "Every minute counts with a stroke. The sooner the person gets treatment, the better their chances of recovery. Never ignore stroke symptoms, even if they seem to improve."
  },
  {
    id: "heat_stroke",
    title: "Heat Stroke",
    category: "urgent",
    icon: "ri-sun-line",
    steps: [
      "Call emergency services immediately (108 in Bengaluru, India).",
      "Move the person to a cool, shaded area.",
      "Remove excessive clothing and cool the person quickly using whatever methods available: spraying with cool water, placing ice packs or wet towels on the head, neck, armpits, and groin, or fanning the person.",
      "If available, check their temperature and try to bring it down to 101-102°F (38.3-38.9°C).",
      "Do not give the person anything to drink if they're unconscious or confused.",
      "If the person is conscious and alert, give them cool water to drink (not ice cold).",
      "Turn the person on their side to prevent choking if they vomit.",
      "If the person is unconscious but breathing, put them in the recovery position.",
      "Continue cooling efforts until their body temperature drops to normal or medical help arrives."
    ],
    warning: "Heat stroke is life-threatening. Signs include: high body temperature (104°F/40°C or higher), altered mental state, hot, dry skin or heavy sweating, nausea and vomiting, flushed skin, rapid breathing, racing heart rate, and headache."
  },
  {
    id: "poisoning",
    title: "Poisoning",
    category: "urgent",
    icon: "ri-flask-line",
    steps: [
      "Call the poison control center (1800-116-117 in India) or emergency services (108 in Bengaluru).",
      "Follow instructions from poison control or emergency dispatcher precisely.",
      "Try to identify the poison (keep container, plant, or substance for medical personnel).",
      "Remove the person from the source of poison if inhalation is occurring.",
      "If poison is on the skin, remove contaminated clothing and rinse skin with running water for 15-20 minutes.",
      "If poison is in the eye, flush with lukewarm water for 15-20 minutes.",
      "Do not try to make the person vomit unless specifically instructed by medical professionals.",
      "If the person vomits naturally, save some of the vomit for testing if possible.",
      "If the person is unconscious but breathing, place them in the recovery position.",
      "If they aren't breathing, begin CPR."
    ],
    warning: "Never induce vomiting unless specifically instructed by a medical professional. Certain poisons can cause more damage coming back up, and if the person is unconscious, they could choke."
  }
];

// Emergency contact numbers (Bengaluru specific)
const emergencyContacts = [
  { name: "Ambulance", number: "108", description: "All-India Emergency Number" },
  { name: "National Emergency Number", number: "112", description: "National Emergency Response System" },
  { name: "Bengaluru Police", number: "100", description: "For police emergencies" },
  { name: "Fire Department", number: "101", description: "Fire emergency services" },
  { name: "Poison Control", number: "1800-116-117", description: "National Poison Information Centre" },
  { name: "Bengaluru Medical Helpline", number: "104", description: "Health information and advice" },
  { name: "Women's Helpline", number: "1091", description: "For women in distress" },
  { name: "Child Helpline", number: "1098", description: "For children in distress" },
  { name: "Victoria Hospital", number: "+91-80-2670-1150", description: "Major government hospital with emergency services" },
  { name: "Bowring & Lady Curzon Hospital", number: "+91-80-2559-1325", description: "24/7 emergency services" },
  { name: "Manipal Hospital", number: "+91-80-2502-4444", description: "Private hospital with emergency care" },
  { name: "Apollo Hospital", number: "+91-80-4612-4444", description: "Private hospital with 24/7 emergency services" },
  { name: "Fortis Hospital", number: "+91-80-6621-4444", description: "Private hospital with emergency department" }
];

export default function FirstAid() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [currentTab, setCurrentTab] = useState("guides");
  const [selectedGuide, setSelectedGuide] = useState<null | typeof firstAidGuides[0]>(null);

  const handleNotifyClick = () => {
    toast({
      title: "Thank you for your interest!",
      description: "We'll notify you when our AI-powered First Aid Assistant becomes available.",
    });
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value.toLowerCase());
  };

  const filteredGuides = firstAidGuides.filter((guide) => 
    guide.title.toLowerCase().includes(searchTerm) || 
    guide.steps.some(step => step.toLowerCase().includes(searchTerm))
  );

  const filteredContacts = emergencyContacts.filter((contact) =>
    contact.name.toLowerCase().includes(searchTerm) ||
    contact.description.toLowerCase().includes(searchTerm) ||
    contact.number.includes(searchTerm)
  );

  const handleGuideSelect = (guide: typeof firstAidGuides[0]) => {
    setSelectedGuide(guide);
  };

  const handleBack = () => {
    setSelectedGuide(null);
  };

  const renderGuidesList = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {filteredGuides.map((guide) => (
        <Card 
          key={guide.id} 
          className={`cursor-pointer hover:shadow-md transition-shadow ${guide.category === 'critical' ? 'border-red-200' : 'border-orange-200'}`}
          onClick={() => handleGuideSelect(guide)}
        >
          <CardContent className="p-4 flex items-start">
            <div className={`mr-3 mt-1 p-2 rounded-full ${guide.category === 'critical' ? 'bg-red-100 text-red-500' : 'bg-orange-100 text-orange-500'}`}>
              <i className={`${guide.icon} text-xl`}></i>
            </div>
            <div>
              <h3 className="font-medium text-lg">{guide.title}</h3>
              <p className="text-sm text-muted-foreground">
                {guide.category === 'critical' ? 'Critical Emergency' : 'Urgent Care Required'}
              </p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  const renderGuideDetail = () => {
    if (!selectedGuide) return null;
    
    return (
      <div>
        <div className="flex items-center mb-4">
          <Button variant="ghost" size="sm" onClick={handleBack} className="mr-2">
            <PanelLeft className="h-4 w-4 mr-1" /> Back to Guides
          </Button>
        </div>
        
        <div className="mb-6 flex items-center">
          <div className={`mr-3 p-3 rounded-full ${selectedGuide.category === 'critical' ? 'bg-red-100 text-red-500' : 'bg-orange-100 text-orange-500'}`}>
            <i className={`${selectedGuide.icon} text-2xl`}></i>
          </div>
          <div>
            <h2 className="text-2xl font-semibold">{selectedGuide.title}</h2>
            <p className="text-muted-foreground">
              {selectedGuide.category === 'critical' ? 'Critical Emergency - Call 108 immediately' : 'Urgent Care Required'}
            </p>
          </div>
        </div>
        
        {selectedGuide.category === 'critical' && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-center">
            <AlertTriangle className="h-5 w-5 text-red-500 mr-2 flex-shrink-0" />
            <p className="text-red-700 text-sm">
              This is a life-threatening emergency. Call <a href="tel:108" className="font-bold">108</a> (Bengaluru emergency services) immediately while administering first aid.
            </p>
          </div>
        )}
        
        <div className="mb-6">
          <h3 className="font-medium text-lg mb-2">Emergency Steps</h3>
          <ol className="space-y-3">
            {selectedGuide.steps.map((step, index) => (
              <li key={index} className="flex">
                <span className="bg-primary/10 text-primary font-medium rounded-full w-6 h-6 flex items-center justify-center mr-2 flex-shrink-0 mt-0.5">
                  {index + 1}
                </span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </div>
        
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <h3 className="font-medium text-amber-800 flex items-center mb-1">
            <AlertTriangle className="h-4 w-4 mr-2" />
            Important Warning
          </h3>
          <p className="text-amber-700 text-sm">{selectedGuide.warning}</p>
        </div>
      </div>
    );
  };

  const renderContactsList = () => (
    <div className="space-y-3">
      {filteredContacts.map((contact, index) => (
        <Card key={index} className="overflow-hidden">
          <div className="flex items-center p-3 md:p-4">
            <div className="bg-primary/10 p-2 rounded-full mr-3">
              <Phone className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-grow">
              <h3 className="font-medium">{contact.name}</h3>
              <p className="text-sm text-muted-foreground">{contact.description}</p>
            </div>
            <a 
              href={`tel:${contact.number}`} 
              className="bg-primary text-white px-3 py-1.5 rounded-md text-sm font-medium hover:bg-primary/90 ml-2"
            >
              {contact.number}
            </a>
          </div>
        </Card>
      ))}
    </div>
  );

  return (
    <Layout title="First Aid Guide">
      <div className="grid grid-cols-1 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <CardTitle className="text-2xl flex items-center">
                  <Heart className="h-6 w-6 mr-2 text-red-500" />
                  First Aid Guide
                </CardTitle>
                <CardDescription>
                  Emergency first aid procedures for common situations
                </CardDescription>
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <Button onClick={handleNotifyClick} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Get AI Assistant
                </Button>
                <Button variant="outline" onClick={() => {
                  setSearchTerm("");
                  setSelectedGuide(null);
                }} className="gap-2">
                  <RefreshCw className="h-4 w-4" />
                  Reset
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Emergency warning */}
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <h3 className="font-medium flex items-center text-red-800">
                <AlertTriangle className="h-5 w-5 mr-2" />
                For all serious medical emergencies
              </h3>
              <p className="text-red-700 mt-1">
                Call <a href="tel:108" className="font-semibold">108</a> (emergency services in Bengaluru) or your local emergency number immediately. This guide is not a substitute for professional medical help.
              </p>
            </div>
            
            {/* Search field */}
            <div className="relative mb-6">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search for first aid procedures or emergency contacts..."
                className="pl-9 py-6"
                value={searchTerm}
                onChange={handleSearch}
              />
            </div>
            
            {/* Tabs for different sections */}
            <Tabs 
              defaultValue="guides" 
              value={currentTab}
              onValueChange={(value) => {
                setCurrentTab(value);
                setSelectedGuide(null);
              }}
              className="mb-6"
            >
              <TabsList className="grid grid-cols-2 mb-6">
                <TabsTrigger value="guides" className="gap-2">
                  <i className="ri-first-aid-kit-line"></i>
                  First Aid Guides
                </TabsTrigger>
                <TabsTrigger value="contacts" className="gap-2">
                  <i className="ri-phone-line"></i>
                  Emergency Contacts
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="guides" className="mt-0">
                {selectedGuide ? renderGuideDetail() : renderGuidesList()}
              </TabsContent>
              
              <TabsContent value="contacts" className="mt-0">
                {renderContactsList()}
              </TabsContent>
            </Tabs>
          </CardContent>
          <CardFooter className="bg-slate-50 border-t">
            <div className="text-sm text-muted-foreground">
              <p>
                <i className="ri-information-line mr-1"></i>
                This guide provides basic first aid information only. Always seek professional medical assistance for all emergencies and health concerns.
                For personalized guidance, consult with healthcare professionals.
              </p>
            </div>
          </CardFooter>
        </Card>
      </div>
    </Layout>
  );
}