import type { SyllabusSubject } from '../types';

export const DEFAULT_SYLLABUS: SyllabusSubject[] = [
  {
    id: 'quantitative-aptitude',
    name: 'Quantitative Aptitude',
    topics: [
      { id: 'quant-1', name: 'Number System (Whole numbers, Decimals, Fractions, Relations)', status: 'pending', notes: '', revisionStatus: 'not_revised' },
      { id: 'quant-2', name: 'Percentages & Average', status: 'pending', notes: '', revisionStatus: 'not_revised' },
      { id: 'quant-3', name: 'Ratio & Proportion, Square Roots', status: 'pending', notes: '', revisionStatus: 'not_revised' },
      { id: 'quant-4', name: 'Interest (Simple & Compound)', status: 'pending', notes: '', revisionStatus: 'not_revised' },
      { id: 'quant-5', name: 'Profit, Loss & Discount', status: 'pending', notes: '', revisionStatus: 'not_revised' },
      { id: 'quant-6', name: 'Partnership Business, Mixture & Alligation', status: 'pending', notes: '', revisionStatus: 'not_revised' },
      { id: 'quant-7', name: 'Time & Work, Time & Distance', status: 'pending', notes: '', revisionStatus: 'not_revised' },
      { id: 'quant-8', name: 'Basic Algebra & Graphs of Linear Equations', status: 'pending', notes: '', revisionStatus: 'not_revised' },
      { id: 'quant-9', name: 'Geometry: Triangles (Congruence, Similarity, Centers)', status: 'pending', notes: '', revisionStatus: 'not_revised' },
      { id: 'quant-10', name: 'Geometry: Circles (Chords, Tangents, Angles)', status: 'pending', notes: '', revisionStatus: 'not_revised' },
      { id: 'quant-11', name: 'Mensuration: Areas (Quadrilaterals, Regular Polygons)', status: 'pending', notes: '', revisionStatus: 'not_revised' },
      { id: 'quant-12', name: 'Mensuration: Volumes (Prisms, Cones, Cylinders, Spheres)', status: 'pending', notes: '', revisionStatus: 'not_revised' },
      { id: 'quant-13', name: 'Trigonometry: Ratios, Identities, Heights & Distances', status: 'pending', notes: '', revisionStatus: 'not_revised' },
      { id: 'quant-14', name: 'Data Interpretation (Tables, Histograms, Pie & Bar Charts)', status: 'pending', notes: '', revisionStatus: 'not_revised' }
    ]
  },
  {
    id: 'reasoning',
    name: 'General Intelligence & Reasoning',
    topics: [
      { id: 'reas-1', name: 'Analogies (Semantic, Symbolic, Number, Figure)', status: 'pending', notes: '', revisionStatus: 'not_revised' },
      { id: 'reas-2', name: 'Classification & Similarities/Differences', status: 'pending', notes: '', revisionStatus: 'not_revised' },
      { id: 'reas-3', name: 'Series (Number, Alphabetical, Figure)', status: 'pending', notes: '', revisionStatus: 'not_revised' },
      { id: 'reas-4', name: 'Coding & Decoding', status: 'pending', notes: '', revisionStatus: 'not_revised' },
      { id: 'reas-5', name: 'Blood Relations & Direction Sense', status: 'pending', notes: '', revisionStatus: 'not_revised' },
      { id: 'reas-6', name: 'Syllogism & Venn Diagrams', status: 'pending', notes: '', revisionStatus: 'not_revised' },
      { id: 'reas-7', name: 'Paper Folding, Unfolding & Pattern Completion', status: 'pending', notes: '', revisionStatus: 'not_revised' },
      { id: 'reas-8', name: 'Mirror Images & Water Images', status: 'pending', notes: '', revisionStatus: 'not_revised' },
      { id: 'reas-9', name: 'Matrix, Word Formation & Venn Diagrams', status: 'pending', notes: '', revisionStatus: 'not_revised' },
      { id: 'reas-10', name: 'Non-Verbal Reasoning & Figure Counting', status: 'pending', notes: '', revisionStatus: 'not_revised' },
      { id: 'reas-11', name: 'Critical Thinking, Emotional & Social Intelligence', status: 'pending', notes: '', revisionStatus: 'not_revised' }
    ]
  },
  {
    id: 'english',
    name: 'English Language & Comprehension',
    topics: [
      { id: 'eng-1', name: 'Spotting the Error (Grammar rules)', status: 'pending', notes: '', revisionStatus: 'not_revised' },
      { id: 'eng-2', name: 'Sentence Improvement & Correction', status: 'pending', notes: '', revisionStatus: 'not_revised' },
      { id: 'eng-3', name: 'Fill in the Blanks (Prepositions, Articles, Vocab)', status: 'pending', notes: '', revisionStatus: 'not_revised' },
      { id: 'eng-4', name: 'Synonyms & Antonyms', status: 'pending', notes: '', revisionStatus: 'not_revised' },
      { id: 'eng-5', name: 'Idioms & Phrases', status: 'pending', notes: '', revisionStatus: 'not_revised' },
      { id: 'eng-6', name: 'One-Word Substitution & Spelling Errors', status: 'pending', notes: '', revisionStatus: 'not_revised' },
      { id: 'eng-7', name: 'Active & Passive Voice conversions', status: 'pending', notes: '', revisionStatus: 'not_revised' },
      { id: 'eng-8', name: 'Direct & Indirect Speech conversions', status: 'pending', notes: '', revisionStatus: 'not_revised' },
      { id: 'eng-9', name: 'Sentence Rearrangement (Para Jumbles)', status: 'pending', notes: '', revisionStatus: 'not_revised' },
      { id: 'eng-10', name: 'Cloze Test (Contextual passage completion)', status: 'pending', notes: '', revisionStatus: 'not_revised' },
      { id: 'eng-11', name: 'Reading Comprehension Passages', status: 'pending', notes: '', revisionStatus: 'not_revised' }
    ]
  },
  {
    id: 'general-awareness',
    name: 'General Awareness',
    topics: [
      // HISTORY - Ancient History
      { id: 'gk-his-anc-1', name: 'Ancient History: Indus Valley Civilization', status: 'pending', notes: '', revisionStatus: 'not_revised', category: 'History' },
      { id: 'gk-his-anc-2', name: 'Ancient History: Vedic Period', status: 'pending', notes: '', revisionStatus: 'not_revised', category: 'History' },
      { id: 'gk-his-anc-3', name: 'Ancient History: Buddhism & Jainism', status: 'pending', notes: '', revisionStatus: 'not_revised', category: 'History' },
      { id: 'gk-his-anc-4', name: 'Ancient History: Maurya & Gupta Empire', status: 'pending', notes: '', revisionStatus: 'not_revised', category: 'History' },
      { id: 'gk-his-anc-5', name: 'Ancient History: Sangam Age', status: 'pending', notes: '', revisionStatus: 'not_revised', category: 'History' },
      { id: 'gk-his-anc-6', name: 'Ancient History: Ancient temples & architecture', status: 'pending', notes: '', revisionStatus: 'not_revised', category: 'History' },
      
      // HISTORY - Medieval History
      { id: 'gk-his-med-1', name: 'Medieval History: Delhi Sultanate', status: 'pending', notes: '', revisionStatus: 'not_revised', category: 'History' },
      { id: 'gk-his-med-2', name: 'Medieval History: Mughal Empire', status: 'pending', notes: '', revisionStatus: 'not_revised', category: 'History' },
      { id: 'gk-his-med-3', name: 'Medieval History: Bhakti & Sufi Movements', status: 'pending', notes: '', revisionStatus: 'not_revised', category: 'History' },
      { id: 'gk-his-med-4', name: 'Medieval History: Vijayanagara Empire', status: 'pending', notes: '', revisionStatus: 'not_revised', category: 'History' },
      { id: 'gk-his-med-5', name: 'Medieval History: Marathas', status: 'pending', notes: '', revisionStatus: 'not_revised', category: 'History' },
      
      // HISTORY - Modern History
      { id: 'gk-his-mod-1', name: 'Modern History: Advent of Europeans', status: 'pending', notes: '', revisionStatus: 'not_revised', category: 'History' },
      { id: 'gk-his-mod-2', name: 'Modern History: Revolt of 1857', status: 'pending', notes: '', revisionStatus: 'not_revised', category: 'History' },
      { id: 'gk-his-mod-3', name: 'Modern History: Indian National Congress', status: 'pending', notes: '', revisionStatus: 'not_revised', category: 'History' },
      { id: 'gk-his-mod-4', name: 'Modern History: Freedom Movements', status: 'pending', notes: '', revisionStatus: 'not_revised', category: 'History' },
      { id: 'gk-his-mod-5', name: 'Modern History: Gandhi Era', status: 'pending', notes: '', revisionStatus: 'not_revised', category: 'History' },
      { id: 'gk-his-mod-6', name: 'Modern History: Revolutionary Movements', status: 'pending', notes: '', revisionStatus: 'not_revised', category: 'History' },
      { id: 'gk-his-mod-7', name: 'Modern History: Important Acts & Committees', status: 'pending', notes: '', revisionStatus: 'not_revised', category: 'History' },
      { id: 'gk-his-mod-8', name: 'Modern History: Independence & Partition', status: 'pending', notes: '', revisionStatus: 'not_revised', category: 'History' },
      
      // HISTORY - Art & Culture
      { id: 'gk-his-art-1', name: 'Art & Culture: Classical dances', status: 'pending', notes: '', revisionStatus: 'not_revised', category: 'History' },
      { id: 'gk-his-art-2', name: 'Art & Culture: Folk dances', status: 'pending', notes: '', revisionStatus: 'not_revised', category: 'History' },
      { id: 'gk-his-art-3', name: 'Art & Culture: Music & instruments', status: 'pending', notes: '', revisionStatus: 'not_revised', category: 'History' },
      { id: 'gk-his-art-4', name: 'Art & Culture: UNESCO heritage sites', status: 'pending', notes: '', revisionStatus: 'not_revised', category: 'History' },
      { id: 'gk-his-art-5', name: 'Art & Culture: Paintings', status: 'pending', notes: '', revisionStatus: 'not_revised', category: 'History' },
      { id: 'gk-his-art-6', name: 'Art & Culture: Temples & architecture', status: 'pending', notes: '', revisionStatus: 'not_revised', category: 'History' },
      { id: 'gk-his-art-7', name: 'Art & Culture: Festivals', status: 'pending', notes: '', revisionStatus: 'not_revised', category: 'History' },
      
      // GEOGRAPHY - Physical Geography
      { id: 'gk-geo-phy-1', name: 'Physical Geography: Earth structure', status: 'pending', notes: '', revisionStatus: 'not_revised', category: 'Geography' },
      { id: 'gk-geo-phy-2', name: 'Physical Geography: Volcanoes & earthquakes', status: 'pending', notes: '', revisionStatus: 'not_revised', category: 'Geography' },
      { id: 'gk-geo-phy-3', name: 'Physical Geography: Mountains, plateaus, plains', status: 'pending', notes: '', revisionStatus: 'not_revised', category: 'Geography' },
      { id: 'gk-geo-phy-4', name: 'Physical Geography: Rivers & oceans', status: 'pending', notes: '', revisionStatus: 'not_revised', category: 'Geography' },
      { id: 'gk-geo-phy-5', name: 'Physical Geography: Climate & atmosphere', status: 'pending', notes: '', revisionStatus: 'not_revised', category: 'Geography' },
      { id: 'gk-geo-phy-6', name: 'Physical Geography: Soil types', status: 'pending', notes: '', revisionStatus: 'not_revised', category: 'Geography' },
      
      // GEOGRAPHY - Indian Geography
      { id: 'gk-geo-ind-1', name: 'Indian Geography: Indian rivers', status: 'pending', notes: '', revisionStatus: 'not_revised', category: 'Geography' },
      { id: 'gk-geo-ind-2', name: 'Indian Geography: Dams & projects', status: 'pending', notes: '', revisionStatus: 'not_revised', category: 'Geography' },
      { id: 'gk-geo-ind-3', name: 'Indian Geography: Minerals', status: 'pending', notes: '', revisionStatus: 'not_revised', category: 'Geography' },
      { id: 'gk-geo-ind-4', name: 'Indian Geography: Agriculture', status: 'pending', notes: '', revisionStatus: 'not_revised', category: 'Geography' },
      { id: 'gk-geo-ind-5', name: 'Indian Geography: National parks', status: 'pending', notes: '', revisionStatus: 'not_revised', category: 'Geography' },
      { id: 'gk-geo-ind-6', name: 'Indian Geography: Forests', status: 'pending', notes: '', revisionStatus: 'not_revised', category: 'Geography' },
      { id: 'gk-geo-ind-7', name: 'Indian Geography: Transport', status: 'pending', notes: '', revisionStatus: 'not_revised', category: 'Geography' },
      { id: 'gk-geo-ind-8', name: 'Indian Geography: Population census', status: 'pending', notes: '', revisionStatus: 'not_revised', category: 'Geography' },
      
      // GEOGRAPHY - World Geography
      { id: 'gk-geo-wor-1', name: 'World Geography: Continents & countries', status: 'pending', notes: '', revisionStatus: 'not_revised', category: 'Geography' },
      { id: 'gk-geo-wor-2', name: 'World Geography: Important straits', status: 'pending', notes: '', revisionStatus: 'not_revised', category: 'Geography' },
      { id: 'gk-geo-wor-3', name: 'World Geography: Deserts', status: 'pending', notes: '', revisionStatus: 'not_revised', category: 'Geography' },
      { id: 'gk-geo-wor-4', name: 'World Geography: International boundaries', status: 'pending', notes: '', revisionStatus: 'not_revised', category: 'Geography' },
      
      // INDIAN POLITY
      { id: 'gk-pol-1', name: 'Polity: Constitution of India', status: 'pending', notes: '', revisionStatus: 'not_revised', category: 'Polity' },
      { id: 'gk-pol-2', name: 'Polity: Preamble', status: 'pending', notes: '', revisionStatus: 'not_revised', category: 'Polity' },
      { id: 'gk-pol-3', name: 'Polity: Fundamental Rights & Duties', status: 'pending', notes: '', revisionStatus: 'not_revised', category: 'Polity' },
      { id: 'gk-pol-4', name: 'Polity: DPSP', status: 'pending', notes: '', revisionStatus: 'not_revised', category: 'Polity' },
      { id: 'gk-pol-5', name: 'Polity: Parliament', status: 'pending', notes: '', revisionStatus: 'not_revised', category: 'Polity' },
      { id: 'gk-pol-6', name: 'Polity: President', status: 'pending', notes: '', revisionStatus: 'not_revised', category: 'Polity' },
      { id: 'gk-pol-7', name: 'Polity: Prime Minister', status: 'pending', notes: '', revisionStatus: 'not_revised', category: 'Polity' },
      { id: 'gk-pol-8', name: 'Polity: Supreme Court', status: 'pending', notes: '', revisionStatus: 'not_revised', category: 'Polity' },
      { id: 'gk-pol-9', name: 'Polity: High Court', status: 'pending', notes: '', revisionStatus: 'not_revised', category: 'Polity' },
      { id: 'gk-pol-10', name: 'Polity: Constitutional bodies', status: 'pending', notes: '', revisionStatus: 'not_revised', category: 'Polity' },
      { id: 'gk-pol-11', name: 'Polity: Emergency provisions', status: 'pending', notes: '', revisionStatus: 'not_revised', category: 'Polity' },
      { id: 'gk-pol-12', name: 'Polity: Elections', status: 'pending', notes: '', revisionStatus: 'not_revised', category: 'Polity' },
      { id: 'gk-pol-13', name: 'Polity: Amendments', status: 'pending', notes: '', revisionStatus: 'not_revised', category: 'Polity' },
      { id: 'gk-pol-14', name: 'Polity: Panchayati Raj', status: 'pending', notes: '', revisionStatus: 'not_revised', category: 'Polity' },
      { id: 'gk-pol-15', name: 'Polity: Important Articles & Schedules', status: 'pending', notes: '', revisionStatus: 'not_revised', category: 'Polity' },
      
      // ECONOMICS - Basic Economics
      { id: 'gk-eco-bas-1', name: 'Economics: GDP, GNP, NNP', status: 'pending', notes: '', revisionStatus: 'not_revised', category: 'Economics' },
      { id: 'gk-eco-bas-2', name: 'Economics: Inflation', status: 'pending', notes: '', revisionStatus: 'not_revised', category: 'Economics' },
      { id: 'gk-eco-bas-3', name: 'Economics: Repo rate', status: 'pending', notes: '', revisionStatus: 'not_revised', category: 'Economics' },
      { id: 'gk-eco-bas-4', name: 'Economics: Fiscal policy', status: 'pending', notes: '', revisionStatus: 'not_revised', category: 'Economics' },
      { id: 'gk-eco-bas-5', name: 'Economics: Monetary policy', status: 'pending', notes: '', revisionStatus: 'not_revised', category: 'Economics' },
      { id: 'gk-eco-bas-6', name: 'Economics: Banking basics', status: 'pending', notes: '', revisionStatus: 'not_revised', category: 'Economics' },
      
      // ECONOMICS - Indian Economy
      { id: 'gk-eco-ind-1', name: 'Indian Economy: Five-year plans', status: 'pending', notes: '', revisionStatus: 'not_revised', category: 'Economics' },
      { id: 'gk-eco-ind-2', name: 'Indian Economy: Budget', status: 'pending', notes: '', revisionStatus: 'not_revised', category: 'Economics' },
      { id: 'gk-eco-ind-3', name: 'Indian Economy: Taxation', status: 'pending', notes: '', revisionStatus: 'not_revised', category: 'Economics' },
      { id: 'gk-eco-ind-4', name: 'Indian Economy: NITI Aayog', status: 'pending', notes: '', revisionStatus: 'not_revised', category: 'Economics' },
      { id: 'gk-eco-ind-5', name: 'Indian Economy: Poverty & unemployment', status: 'pending', notes: '', revisionStatus: 'not_revised', category: 'Economics' },
      { id: 'gk-eco-ind-6', name: 'Indian Economy: Government schemes', status: 'pending', notes: '', revisionStatus: 'not_revised', category: 'Economics' },
      { id: 'gk-eco-ind-7', name: 'Indian Economy: Economic reforms', status: 'pending', notes: '', revisionStatus: 'not_revised', category: 'Economics' },
      
      // GENERAL SCIENCE - Physics
      { id: 'gk-sci-phy-1', name: 'Physics: Motion', status: 'pending', notes: '', revisionStatus: 'not_revised', category: 'Science' },
      { id: 'gk-sci-phy-2', name: 'Physics: Force', status: 'pending', notes: '', revisionStatus: 'not_revised', category: 'Science' },
      { id: 'gk-sci-phy-3', name: 'Physics: Work & energy', status: 'pending', notes: '', revisionStatus: 'not_revised', category: 'Science' },
      { id: 'gk-sci-phy-4', name: 'Physics: Electricity', status: 'pending', notes: '', revisionStatus: 'not_revised', category: 'Science' },
      { id: 'gk-sci-phy-5', name: 'Physics: Magnetism', status: 'pending', notes: '', revisionStatus: 'not_revised', category: 'Science' },
      { id: 'gk-sci-phy-6', name: 'Physics: Heat', status: 'pending', notes: '', revisionStatus: 'not_revised', category: 'Science' },
      { id: 'gk-sci-phy-7', name: 'Physics: Sound', status: 'pending', notes: '', revisionStatus: 'not_revised', category: 'Science' },
      { id: 'gk-sci-phy-8', name: 'Physics: Light', status: 'pending', notes: '', revisionStatus: 'not_revised', category: 'Science' },
      
      // GENERAL SCIENCE - Chemistry
      { id: 'gk-sci-chm-1', name: 'Chemistry: Acids & bases', status: 'pending', notes: '', revisionStatus: 'not_revised', category: 'Science' },
      { id: 'gk-sci-chm-2', name: 'Chemistry: Metals & non-metals', status: 'pending', notes: '', revisionStatus: 'not_revised', category: 'Science' },
      { id: 'gk-sci-chm-3', name: 'Chemistry: Chemical reactions', status: 'pending', notes: '', revisionStatus: 'not_revised', category: 'Science' },
      { id: 'gk-sci-chm-4', name: 'Chemistry: Periodic table', status: 'pending', notes: '', revisionStatus: 'not_revised', category: 'Science' },
      { id: 'gk-sci-chm-5', name: 'Chemistry: Common compounds', status: 'pending', notes: '', revisionStatus: 'not_revised', category: 'Science' },
      { id: 'gk-sci-chm-6', name: 'Chemistry: Everyday chemistry', status: 'pending', notes: '', revisionStatus: 'not_revised', category: 'Science' },
      
      // GENERAL SCIENCE - Biology
      { id: 'gk-sci-bio-1', name: 'Biology: Human body', status: 'pending', notes: '', revisionStatus: 'not_revised', category: 'Science' },
      { id: 'gk-sci-bio-2', name: 'Biology: Diseases', status: 'pending', notes: '', revisionStatus: 'not_revised', category: 'Science' },
      { id: 'gk-sci-bio-3', name: 'Biology: Vitamins', status: 'pending', notes: '', revisionStatus: 'not_revised', category: 'Science' },
      { id: 'gk-sci-bio-4', name: 'Biology: Nutrition', status: 'pending', notes: '', revisionStatus: 'not_revised', category: 'Science' },
      { id: 'gk-sci-bio-5', name: 'Biology: Genetics', status: 'pending', notes: '', revisionStatus: 'not_revised', category: 'Science' },
      { id: 'gk-sci-bio-6', name: 'Biology: Plants & animals', status: 'pending', notes: '', revisionStatus: 'not_revised', category: 'Science' },
      { id: 'gk-sci-bio-7', name: 'Biology: Human organs', status: 'pending', notes: '', revisionStatus: 'not_revised', category: 'Science' },
      { id: 'gk-sci-bio-8', name: 'Biology: Hormones', status: 'pending', notes: '', revisionStatus: 'not_revised', category: 'Science' },
      
      // CURRENT AFFAIRS
      { id: 'gk-ca-1', name: 'Current Affairs: National news', status: 'pending', notes: '', revisionStatus: 'not_revised', category: 'Current Affairs' },
      { id: 'gk-ca-2', name: 'Current Affairs: International news', status: 'pending', notes: '', revisionStatus: 'not_revised', category: 'Current Affairs' },
      { id: 'gk-ca-3', name: 'Current Affairs: Sports', status: 'pending', notes: '', revisionStatus: 'not_revised', category: 'Current Affairs' },
      { id: 'gk-ca-4', name: 'Current Affairs: Awards', status: 'pending', notes: '', revisionStatus: 'not_revised', category: 'Current Affairs' },
      { id: 'gk-ca-5', name: 'Current Affairs: Government schemes', status: 'pending', notes: '', revisionStatus: 'not_revised', category: 'Current Affairs' },
      { id: 'gk-ca-6', name: 'Current Affairs: Summits', status: 'pending', notes: '', revisionStatus: 'not_revised', category: 'Current Affairs' },
      { id: 'gk-ca-7', name: 'Current Affairs: Appointments', status: 'pending', notes: '', revisionStatus: 'not_revised', category: 'Current Affairs' },
      { id: 'gk-ca-8', name: 'Current Affairs: Books & authors', status: 'pending', notes: '', revisionStatus: 'not_revised', category: 'Current Affairs' },
      { id: 'gk-ca-9', name: 'Current Affairs: Obituaries', status: 'pending', notes: '', revisionStatus: 'not_revised', category: 'Current Affairs' },
      { id: 'gk-ca-10', name: 'Current Affairs: Science & technology', status: 'pending', notes: '', revisionStatus: 'not_revised', category: 'Current Affairs' },
      { id: 'gk-ca-11', name: 'Current Affairs: Defense exercises', status: 'pending', notes: '', revisionStatus: 'not_revised', category: 'Current Affairs' },
      
      // STATIC GK
      { id: 'gk-st-1', name: 'Static GK: Capitals & currencies', status: 'pending', notes: '', revisionStatus: 'not_revised', category: 'Static GK' },
      { id: 'gk-st-2', name: 'Static GK: Important organizations', status: 'pending', notes: '', revisionStatus: 'not_revised', category: 'Static GK' },
      { id: 'gk-st-3', name: 'Static GK: Headquarters', status: 'pending', notes: '', revisionStatus: 'not_revised', category: 'Static GK' },
      { id: 'gk-st-4', name: 'Static GK: National symbols', status: 'pending', notes: '', revisionStatus: 'not_revised', category: 'Static GK' },
      { id: 'gk-st-5', name: 'Static GK: Important days', status: 'pending', notes: '', revisionStatus: 'not_revised', category: 'Static GK' },
      { id: 'gk-st-6', name: 'Static GK: First in India/world', status: 'pending', notes: '', revisionStatus: 'not_revised', category: 'Static GK' },
      { id: 'gk-st-7', name: 'Static GK: Famous personalities', status: 'pending', notes: '', revisionStatus: 'not_revised', category: 'Static GK' },
      { id: 'gk-st-8', name: 'Static GK: Dams', status: 'pending', notes: '', revisionStatus: 'not_revised', category: 'Static GK' },
      { id: 'gk-st-9', name: 'Static GK: Airports', status: 'pending', notes: '', revisionStatus: 'not_revised', category: 'Static GK' },
      { id: 'gk-st-10', name: 'Static GK: Stadiums', status: 'pending', notes: '', revisionStatus: 'not_revised', category: 'Static GK' },
      { id: 'gk-st-11', name: 'Static GK: Brands & taglines', status: 'pending', notes: '', revisionStatus: 'not_revised', category: 'Static GK' },
      
      // ENVIRONMENT & ECOLOGY
      { id: 'gk-env-1', name: 'Environment: Climate change', status: 'pending', notes: '', revisionStatus: 'not_revised', category: 'Environment' },
      { id: 'gk-env-2', name: 'Environment: Biodiversity', status: 'pending', notes: '', revisionStatus: 'not_revised', category: 'Environment' },
      { id: 'gk-env-3', name: 'Environment: Wildlife sanctuaries', status: 'pending', notes: '', revisionStatus: 'not_revised', category: 'Environment' },
      { id: 'gk-env-4', name: 'Environment: National parks', status: 'pending', notes: '', revisionStatus: 'not_revised', category: 'Environment' },
      { id: 'gk-env-5', name: 'Environment: Environmental organizations', status: 'pending', notes: '', revisionStatus: 'not_revised', category: 'Environment' },
      { id: 'gk-env-6', name: 'Environment: Pollution', status: 'pending', notes: '', revisionStatus: 'not_revised', category: 'Environment' },
      { id: 'gk-env-7', name: 'Environment: COP summits', status: 'pending', notes: '', revisionStatus: 'not_revised', category: 'Environment' },
      
      // COMPUTER & TECHNOLOGY
      { id: 'gk-comp-1', name: 'Computer: Basic computer terms', status: 'pending', notes: '', revisionStatus: 'not_revised', category: 'Computer' },
      { id: 'gk-comp-2', name: 'Computer: MS Office', status: 'pending', notes: '', revisionStatus: 'not_revised', category: 'Computer' },
      { id: 'gk-comp-3', name: 'Computer: Internet', status: 'pending', notes: '', revisionStatus: 'not_revised', category: 'Computer' },
      { id: 'gk-comp-4', name: 'Computer: Networking basics', status: 'pending', notes: '', revisionStatus: 'not_revised', category: 'Computer' },
      { id: 'gk-comp-5', name: 'Computer: Hardware/software', status: 'pending', notes: '', revisionStatus: 'not_revised', category: 'Computer' },
      { id: 'gk-comp-6', name: 'Computer: Cyber security basics', status: 'pending', notes: '', revisionStatus: 'not_revised', category: 'Computer' }
    ]
  }
];
