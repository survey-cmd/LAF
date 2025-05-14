// AI Processor Module for Limo Anywhere Assistant

class AIProcessor {
  constructor(apiKey = null) {
    this.apiKey = apiKey;
    this.modelName = 'gpt-3.5-turbo'; // Default model
    this.confidenceThreshold = 0.3;  // Lower the threshold to catch more fields
    this.initialized = false;
    this.useLocalProcessing = true; // Default to local processing unless API key provided
  }

  // Initialize the processor with settings
  async initialize(settings = {}) {
    // Apply settings if provided
    if (settings.apiKey) {
      this.apiKey = settings.apiKey;
      this.useLocalProcessing = false;
    }
    if (settings.modelName) this.modelName = settings.modelName;
    if (settings.confidenceThreshold) this.confidenceThreshold = settings.confidenceThreshold;
    if (settings.aiProvider === 'local') this.useLocalProcessing = true;
    
    // If we have an API key, we can use the API
    this.initialized = true;
    
    return this.initialized;
  }

  // Main processing function
  async processText(text) {
    console.log('AI Processor: Processing text:', text.substring(0, 50) + '...');
    
    if (!text || text.trim() === '') {
      throw new Error('No text provided for processing');
    }
    
    try {
      // If we have an API key and not using local processing, use the AI service
      if (!this.useLocalProcessing && this.apiKey) {
        return await this.callAIService(text);
      } else {
        // Otherwise use our rule-based extraction
        return this.extractEntities(text);
      }
    } catch (error) {
      console.error('AI Processor: Error processing text:', error);
      throw new Error(`Failed to process text: ${error.message}`);
    }
  }

  // Call AI service (placeholder for actual API integration)
  async callAIService(text) {
    console.log('AI Processor: Calling AI service...');
    
    // In a real implementation, this would call an actual API
    // For now, we'll use enhanced rule-based extraction instead
    return this.extractEntities(text);
  }

  // Rule-based entity extraction
  extractEntities(text) {
    console.log('AI Processor: Performing rule-based extraction');
    
    // Normalize text for processing - replace newlines with a marker so we can split properly
    const normalizedText = text.replace(/\n/g, " [NL] ").replace(/\r/g, "").replace(/\s+/g, ' ').trim();
    
    // Split by our newline marker
    const lines = normalizedText.split("[NL]").map(line => line.trim()).filter(line => line.length > 0);
    
    console.log('Lines detected:', lines);
    
    // Initialize results object with all fields
    const results = {
      firstName: { text: '', confidence: 0 },
      lastName: { text: '', confidence: 0 },
      address: { text: '', confidence: 0 },
      city: { text: '', confidence: 0 },
      state: { text: '', confidence: 0 },
      zipCode: { text: '', confidence: 0 },
      phone: { text: '', confidence: 0 },
      email: { text: '', confidence: 0 },
      // Transportation fields
      pickupLocation: { text: '', confidence: 0 },
      destination: { text: '', confidence: 0 },
      pickupTime: { text: '', confidence: 0 },
      pickupDate: { text: '', confidence: 0 },
      passengers: { text: '', confidence: 0 },
      serviceType: { text: '', confidence: 0 },
      vehicleType: { text: '', confidence: 0 },
      hours: { text: '', confidence: 0 }
    };
    
    // Extract name (look for common name patterns)
    this.extractName(normalizedText, lines, results);
    
    // Extract transportation info (do this before address to help with context)
    this.extractTransportationInfo(normalizedText, lines, results);
    
    // Extract address
    this.extractAddress(normalizedText, lines, results);
    
    // Extract phone number
    this.extractPhone(normalizedText, lines, results);
    
    // Extract email
    this.extractEmail(normalizedText, lines, results);

    console.log('Extracted data (before filtering):', results);
    
    // Filter out low-confidence results
    Object.keys(results).forEach(key => {
      if (results[key].confidence < this.confidenceThreshold) {
        results[key].text = '';
      }
    });
    
    return results;
  }

  // Extract transportation details
  extractTransportationInfo(text, lines, results) {
    // Extract pickup location - look specifically for this pattern
    const pickupLocationPatterns = [
      /pick(?:\s|-)up\s+location\s*:?\s*(.+?)(?:\n|\[NL\]|$)/i,
      /from\s*:?\s*(.+?)(?:\n|\[NL\]|$)/i,
      /pickup\s*:?\s*(.+?)(?:\n|\[NL\]|$)/i,
      /pick(?:\s|-)up(?:\s+(?:address|location))?\s*:?\s*(.+?)(?:\n|\[NL\]|$)/i,
      /origin\s*:?\s*(.+?)(?:\n|\[NL\]|$)/i
    ];
    
    for (const pattern of pickupLocationPatterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        results.pickupLocation.text = match[1].trim();
        results.pickupLocation.confidence = 0.9;
        
        // If we don't have an address yet, use this as the address too
        if (!results.address.text) {
          results.address.text = results.pickupLocation.text;
          results.address.confidence = 0.8;
          
          // Try to extract city, state, zip from this
          this.extractAddressComponents(results.pickupLocation.text, results);
        }
        break;
      }
    }
    
    // Check specific lines for location patterns
    for (const line of lines) {
      if (!results.pickupLocation.text && line.match(/pick|from|origin|location/i) && !line.match(/drop|to|destination/i)) {
        // This line looks like a pickup location
        const locationText = line.replace(/^.*?:\s*/, '').trim();
        if (locationText) {
          results.pickupLocation.text = locationText;
          results.pickupLocation.confidence = 0.85;
          
          if (!results.address.text) {
            results.address.text = locationText;
            results.address.confidence = 0.75;
            this.extractAddressComponents(locationText, results);
          }
        }
      }
    }
    
    // Extract destination
    const destinationPatterns = [
      /destination\s*:?\s*(.+?)(?:\n|\[NL\]|$)/i,
      /to\s*:?\s*(.+?)(?:\n|\[NL\]|$)/i,
      /drop(?:\s|-)off(?:\s+(?:address|location))?\s*:?\s*(.+?)(?:\n|\[NL\]|$)/i
    ];
    
    for (const pattern of destinationPatterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        results.destination.text = match[1].trim();
        results.destination.confidence = 0.9;
        break;
      }
    }
    
    // Check specific lines for destination patterns
    for (const line of lines) {
      if (!results.destination.text && line.match(/drop|to|destination/i) && !line.match(/pick|from|origin/i)) {
        // This line looks like a destination
        const locationText = line.replace(/^.*?:\s*/, '').trim();
        if (locationText) {
          results.destination.text = locationText;
          results.destination.confidence = 0.85;
        }
      }
    }
    
    // Extract pickup time
    const timePatterns = [
      /pick(?:\s|-)up\s+time\s*:?\s*(.+?)(?:\n|\[NL\]|$)/i,
      /(?:pick(?:\s|-)up|departure)\s+(?:at|@)\s*(\d{1,2}(?::\d{2})?\s*(?:am|pm|a\.m\.|p\.m\.))/i,
      /time\s*:?\s*(\d{1,2}(?::\d{2})?\s*(?:am|pm|a\.m\.|p\.m\.))/i,
      /(?:^|\s)(\d{1,2}(?::\d{2})?\s*(?:am|pm|a\.m\.|p\.m\.))(?:\s|$)/i
    ];
    
    for (const pattern of timePatterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        results.pickupTime.text = match[1].trim();
        results.pickupTime.confidence = 0.9;
        break;
      }
    }
    
    // Look for times in each line
    if (!results.pickupTime.text) {
      for (const line of lines) {
        if (line.match(/time|pickup|pick up|pick-up/i)) {
          const timeMatch = line.match(/(\d{1,2}(?::\d{2})?\s*(?:am|pm|a\.m\.|p\.m\.))/i);
          if (timeMatch) {
            results.pickupTime.text = timeMatch[1].trim();
            results.pickupTime.confidence = 0.85;
            break;
          }
        }
      }
    }
    
    // Extract date
    const datePatterns = [
      /(?:date|event\s+date)\s*:?\s*(.+?)(?:\n|\[NL\]|$)/i,
      /on\s+((?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+\d{1,2}(?:st|nd|rd|th)?(?:\s*,?\s*\d{2,4})?)/i,
      /(\d{1,2}\/\d{1,2}\/\d{2,4})/i,
      /(\d{1,2}-\d{1,2}-\d{2,4})/i,
      /(?:^|\s)((?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+\d{1,2}(?:st|nd|rd|th)?(?:\s*,?\s*\d{2,4})?)(?:\s|$)/i
    ];
    
    for (const pattern of datePatterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        results.pickupDate.text = match[1].trim();
        results.pickupDate.confidence = 0.9;
        break;
      }
    }
    
    // Look for dates in each line
    if (!results.pickupDate.text) {
      for (const line of lines) {
        if (line.match(/date|on|pickup|pick up|pick-up|event/i)) {
          // Look for month names
          const monthMatch = line.match(/(Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+\d{1,2}(?:st|nd|rd|th)?(?:\s*,?\s*\d{2,4})?/i);
          if (monthMatch) {
            results.pickupDate.text = monthMatch[0].trim();
            results.pickupDate.confidence = 0.85;
            break;
          }
          
          // Look for numeric dates
          const numericMatch = line.match(/\d{1,2}\/\d{1,2}\/\d{2,4}/i);
          if (numericMatch) {
            results.pickupDate.text = numericMatch[0].trim();
            results.pickupDate.confidence = 0.85;
            break;
          }
        }
      }
    }
    
    // Extract passenger count
    const passengerPatterns = [
      /(?:number\s+of\s+passengers|passengers)\s*:?\s*(\d+)/i,
      /(\d+)\s+(?:passenger|person|people|pax)/i,
      /passengers?:?\s*(\d+)/i
    ];
    
    for (const pattern of passengerPatterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        results.passengers.text = match[1].trim();
        results.passengers.confidence = 0.95;
        break;
      }
    }
    
    // Extract hours
    const hoursPatterns = [
      /(?:number\s+of\s+hours|hours)\s*:?\s*(\d+)/i,
      /hours?:?\s*(\d+(?:\.\d+)?)/i
    ];
    
    for (const pattern of hoursPatterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        results.hours.text = match[1].trim();
        results.hours.confidence = 0.95;
        break;
      }
    }
    
    // Extract service type
    const serviceTypePatterns = [
      /(?:type\s+of\s+service|service\s+type)\s*:?\s*(.+?)(?:\n|\[NL\]|$)/i,
      /service\s*:?\s*(.+?)(?:\n|\[NL\]|$)/i
    ];
    
    for (const pattern of serviceTypePatterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        results.serviceType.text = match[1].trim();
        results.serviceType.confidence = 0.9;
        break;
      }
    }
    
    // Extract vehicle type
    const vehicleTypePatterns = [
      /(?:vehicle\s+type|car\s+type)\s*:?\s*(.+?)(?:\n|\[NL\]|$)/i,
      /vehicle\s*:?\s*(.+?)(?:\n|\[NL\]|$)/i,
      /car\s*:?\s*(.+?)(?:\n|\[NL\]|$)/i
    ];
    
    for (const pattern of vehicleTypePatterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        results.vehicleType.text = match[1].trim();
        results.vehicleType.confidence = 0.9;
        break;
      }
    }
    
    // Look for common airport indicators in text
    if (!results.pickupLocation.text || !results.destination.text) {
      const airportRegex = /\b(?:airport|terminal|international)\b/i;
      const airportLines = lines.filter(line => airportRegex.test(line));
      
      for (const line of airportLines) {
        // If this line contains airport info but we don't have pickup location
        if (!results.pickupLocation.text && (line.match(/pick|from|origin|departure/i) || !line.match(/drop|to|destination|arrival/i))) {
          results.pickupLocation.text = line.replace(/^.*?:\s*/, '').trim();
          results.pickupLocation.confidence = 0.8;
        } 
        // If this line contains airport info but we don't have destination
        else if (!results.destination.text && (line.match(/drop|to|destination|arrival/i) || !results.pickupLocation.text)) {
          results.destination.text = line.replace(/^.*?:\s*/, '').trim();
          results.destination.confidence = 0.8;
        }
      }
    }
  }

  // Name extraction helper - improved with line analysis
  extractName(text, lines, results) {
    // Try multiple approaches to find name
    
    // Pattern 1: "Name: John Smith" or "Full Name: John Smith"
    const namePattern1 = /(?:name|full name|passenger|client|customer)\s*:?\s*([A-Za-z]+)(?:\s+([A-Za-z]+))?/i;
    let nameMatch = null;
    
    // First try searching the whole text
    nameMatch = text.match(namePattern1);
    
    // If not found, try each line
    if (!nameMatch) {
      for (const line of lines) {
        nameMatch = line.match(namePattern1);
        if (nameMatch) break;
      }
    }
    
    if (nameMatch) {
      if (nameMatch[1]) {
        results.firstName.text = nameMatch[1];
        results.firstName.confidence = 0.9;
      }
      if (nameMatch[2]) {
        results.lastName.text = nameMatch[2];
        results.lastName.confidence = 0.9;
      }
      return;
    }
    
    // Pattern 2: "First Name: John" and "Last Name: Smith" separately
    const firstNamePattern = /(?:first name|first|given name)\s*:?\s*([A-Za-z]+)/i;
    const lastNamePattern = /(?:last name|last|surname|family name)\s*:?\s*([A-Za-z]+)/i;
    
    let foundFirstName = false;
    let foundLastName = false;
    
    // Check each line for name patterns
    for (const line of lines) {
      if (!foundFirstName) {
        const firstNameMatch = line.match(firstNamePattern);
        if (firstNameMatch) {
          results.firstName.text = firstNameMatch[1];
          results.firstName.confidence = 0.85;
          foundFirstName = true;
        }
      }
      
      if (!foundLastName) {
        const lastNameMatch = line.match(lastNamePattern);
        if (lastNameMatch) {
          results.lastName.text = lastNameMatch[1];
          results.lastName.confidence = 0.85;
          foundLastName = true;
        }
      }
    }
    
    // If first and last name were found separately, return
    if (foundFirstName && foundLastName) {
      return;
    }
    
    // Pattern 3: Look for a name-like pattern at the beginning of text or lines
    const namePattern3 = /^([A-Z][a-z]+)\s+([A-Z][a-z]+)(?:\s|,|\.)/;
    
    // Try the first few lines for a name
    for (let i = 0; i < Math.min(3, lines.length); i++) {
      const line = lines[i].trim();
      if (line.length > 0) {
        const nameMatch = line.match(namePattern3);
        if (nameMatch) {
          results.firstName.text = nameMatch[1];
          results.firstName.confidence = 0.7;
          results.lastName.text = nameMatch[2];
          results.lastName.confidence = 0.7;
          return;
        }
      }
    }
    
    // Pattern 4: Look for "Here is your lead info!" followed by a name
    const leadInfoPattern = /here is your lead info!?\s*(?:\n|\[NL\])\s*name:?\s*([A-Za-z]+)\s+([A-Za-z]+)/i;
    const leadMatch = text.match(leadInfoPattern);
    
    if (leadMatch) {
      results.firstName.text = leadMatch[1];
      results.firstName.confidence = 0.95;
      results.lastName.text = leadMatch[2];
      results.lastName.confidence = 0.95;
      return;
    }
    
    // Pattern 5: Look for a name as a line or after a greeting
    const greetingPattern = /(?:dear|hello|hi|to)\s+([A-Z][a-z]+)(?:\s+([A-Z][a-z]+))?(?:\s|,|\.)/i;
    const greetingMatch = text.match(greetingPattern);
    
    if (greetingMatch) {
      results.firstName.text = greetingMatch[1];
      results.firstName.confidence = 0.6;
      
      if (greetingMatch[2]) {
        results.lastName.text = greetingMatch[2];
        results.lastName.confidence = 0.6;
      }
    }
  }

  // Improved address parsing
  extractAddress(text, lines, results) {
    // If pickup location was already identified, use it first
    if (results.pickupLocation?.text) {
      this.extractAddressComponents(results.pickupLocation.text, results);
      if (results.city.text && results.state.text) {
        return; // We got what we need from pickup location
      }
    }
    
    // Pattern 1: "Address: 123 Main St, Anytown, CA 12345"
    const addressPatterns = [
      /(?:address|location|street|addr)\s*:?\s*(.+?)(?:\n|\[NL\]|$)/i,
      /(?:address|location|street|addr)[:\s]\s*(.+?)(?:\n|\[NL\]|$)/i
    ];
    
    // Try each pattern
    for (const pattern of addressPatterns) {
      const addressMatch = text.match(pattern);
      if (addressMatch) {
        const fullAddress = addressMatch[1].trim();
        results.address.text = fullAddress;
        results.address.confidence = 0.9;
        
        // Extract components
        this.extractAddressComponents(fullAddress, results);
        return;
      }
    }
    
    // Try to find address-like line (numbers followed by words)
    for (const line of lines) {
      if (this.looksLikeAddressLine(line)) {
        results.address.text = line.trim();
        results.address.confidence = 0.8;
        this.extractAddressComponents(line, results);
        return;
      }
    }
  }

// Extract city, state, zip from address text
extractAddressComponents(addressText, results) {
  console.log('Extracting address components from:', addressText);
  
  // Check for specific known locations
  if (addressText.toLowerCase().includes('logan airport') || 
      addressText.toLowerCase().includes('bos') ||
      addressText.toLowerCase().includes('east boston')) {
    results.city.text = 'Boston';
    results.city.confidence = 0.95;
    results.state.text = 'MA';
    results.state.confidence = 0.95;
    console.log('Found Logan Airport location');
    return;
  }
  
  // Check for Swansea, MA pattern
  if (addressText.toLowerCase().includes('swansea')) {
    results.city.text = 'Swansea';
    results.city.confidence = 0.95;
    results.state.text = 'MA';
    results.state.confidence = 0.95;
    console.log('Found Swansea, MA pattern');
    return;
  }
  
  // Extract "Barneyville Road, Swansea, MA" pattern
  const roadCityStatePattern = /([^,]+)(?:,\s+([^,]+))(?:,\s+([A-Z]{2}))/i;
  const roadCityMatch = addressText.match(roadCityStatePattern);
  
  if (roadCityMatch) {
    const [_, road, city, state] = roadCityMatch;
    console.log('Road city state match:', road, city, state);
    
    // Don't use the road as city
    if (!results.city.text || results.city.confidence < 0.9) {
      results.city.text = city.trim();
      results.city.confidence = 0.95;
    }
    
    if (!results.state.text || results.state.confidence < 0.9) {
      results.state.text = state.toUpperCase();
      results.state.confidence = 0.95;
    }
    
    return;
  }
  
  // Process full address to extract components
  
  // 1. Try to match standard address pattern: Street, City, State ZIP
  const fullPattern = /^(.+),\s*([^,]+),\s*([A-Z]{2})(?:\s+(\d{5}(?:-\d{4})?))?$/i;
  const fullMatch = addressText.match(fullPattern);
  
  if (fullMatch) {
    // Full address match found
    const [_, street, city, state, zip] = fullMatch;
    console.log('Full address match:', street, city, state, zip);
    
    // Only set these if they're not already set or if we have higher confidence
    if (!results.address.text || results.address.confidence < 0.9) {
      results.address.text = street.trim();
      results.address.confidence = 0.95;
    }
    
    if (!results.city.text || results.city.confidence < 0.9) {
      results.city.text = city.trim();
      results.city.confidence = 0.95;
    }
    
    if (!results.state.text || results.state.confidence < 0.9) {
      results.state.text = state.toUpperCase();
      results.state.confidence = 0.95;
    }
    
    if (zip && (!results.zipCode.text || results.zipCode.confidence < 0.9)) {
      results.zipCode.text = zip;
      results.zipCode.confidence = 0.95;
    }
    
    return;
  }
  
  // 2. Try to extract city and state if no full match
  // Look for patterns like "City, ST" or "City, State"
  const cityStatePattern = /([^,]+),\s*([A-Z]{2}|[A-Za-z]+)(?:\s+(\d{5}(?:-\d{4})?))?/i;
  const cityStateMatch = addressText.match(cityStatePattern);
  
  if (cityStateMatch) {
    const [_, city, state, zip] = cityStateMatch;
    console.log('City-state match:', city, state, zip);
    
    // Make sure we're not mistaking a road name for a city
    if (!city.match(/road|street|avenue|lane|drive|boulevard|place|plaza/i)) {
      if (!results.city.text || results.city.confidence < 0.8) {
        results.city.text = city.trim();
        results.city.confidence = 0.85;
      }
    }
    
    // Convert state name to abbreviation if needed
    if (state.length > 2) {
      const stateAbbr = this.getStateAbbreviation(state.trim());
      if (stateAbbr && (!results.state.text || results.state.confidence < 0.8)) {
        results.state.text = stateAbbr;
        results.state.confidence = 0.85;
      }
    } else if (!results.state.text || results.state.confidence < 0.8) {
      results.state.text = state.toUpperCase();
      results.state.confidence = 0.85;
    }
    
    if (zip && (!results.zipCode.text || results.zipCode.confidence < 0.9)) {
      results.zipCode.text = zip;
      results.zipCode.confidence = 0.9;
    }
  }
  
  // 3. If we have landmarks like "Airport", try to extract location info
  if (addressText.match(/airport|terminal/i)) {
    const airportPattern = /(.*?)\s*(?:airport|international|terminal)\s*(?:\(([A-Z]{3})\))?(?:[,\s]+([A-Za-z\s]+))?(?:[,\s]+([A-Z]{2}))?/i;
    const airportMatch = addressText.match(airportPattern);
    
    if (airportMatch) {
      // [full, airportName, airportCode, airportCity, airportState]
      const [_, airportName, airportCode, airportCity, airportState] = airportMatch;
      console.log('Airport match:', airportName, airportCode, airportCity, airportState);
      
      if (airportCity && (!results.city.text || results.city.confidence < 0.8)) {
        results.city.text = airportCity.trim();
        results.city.confidence = 0.85;
      }
      
      if (airportState && (!results.state.text || results.state.confidence < 0.8)) {
        results.state.text = airportState.toUpperCase();
        results.state.confidence = 0.85;
      }
      
      // If we see BOS code, it's Boston
      if (airportCode === 'BOS' || airportName.toLowerCase().includes('logan')) {
        results.city.text = 'Boston';
        results.city.confidence = 0.95;
        results.state.text = 'MA';
        results.state.confidence = 0.95;
      }
    }
  }
}

  // Phone extraction helper - improved with better patterns
  extractPhone(text, lines, results) {
    // Various phone patterns
    const phonePatterns = [
      // Pattern with label
      /(?:phone|cell|mobile|tel|telephone|number|ph)[:\s]+(\+?1?[\s-\.]?\(?\d{3}\)?[\s-\.]?\d{3}[\s-\.]?\d{4})/i,
      
      // Standalone US phone numbers
      /\b(\+?1?[\s-\.]?\(?\d{3}\)?[\s-\.]?\d{3}[\s-\.]?\d{4})\b/,
      
      // Formatted with parentheses
      /\b\((\d{3})\)[\s-\.]?(\d{3})[\s-\.]?(\d{4})\b/,
      
      // Formatted with dashes or dots
      /\b(\d{3})[\s-\.](\d{3})[\s-\.](\d{4})\b/
    ];
    
    // Try each pattern on the full text first
    for (const pattern of phonePatterns) {
      const match = text.match(pattern);
      if (match) {
        // Format the phone number consistently
        let phoneNumber;
        if (match.length > 3) {
          // This is the pattern with capture groups for each part
          phoneNumber = `(${match[1]}) ${match[2]}-${match[3]}`;
        } else {
          // This is the pattern with the whole number
          phoneNumber = this.formatPhoneNumber(match[1]);
        }
        
        results.phone.text = phoneNumber;
        results.phone.confidence = 0.9;
        return;
      }
    }
    
    // If not found in full text, try each line
    for (const line of lines) {
      for (const pattern of phonePatterns) {
        const match = line.match(pattern);
        if (match) {
          // Format the phone number consistently
          let phoneNumber;
          if (match.length > 3) {
            // This is the pattern with capture groups for each part
            phoneNumber = `(${match[1]}) ${match[2]}-${match[3]}`;
          } else {
            // This is the pattern with the whole number
            phoneNumber = this.formatPhoneNumber(match[1]);
          }
          
          results.phone.text = phoneNumber;
          results.phone.confidence = 0.9;
          return;
        }
      }
    }
  }

  // Helper to format phone numbers consistently
  formatPhoneNumber(phone) {
    if (!phone) return '';
    
    // Remove all non-digit characters
    const digits = phone.replace(/\D/g, '');
    
    // Format based on number of digits
    if (digits.length === 10) {
      return `(${digits.substring(0, 3)}) ${digits.substring(3, 6)}-${digits.substring(6)}`;
    } else if (digits.length === 11 && digits.charAt(0) === '1') {
      return `(${digits.substring(1, 4)}) ${digits.substring(4, 7)}-${digits.substring(7)}`;
    }
    
    // Return as is if we can't format it
    return phone;
  }

  // Email extraction helper - improved with better line scanning
 // Email extraction helper - improved with better line scanning
  extractEmail(text, lines, results) {
    // Standard email pattern
    const emailPattern = /\b([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})\b/;
    
    // First try the full text
    const emailMatch = text.match(emailPattern);
    if (emailMatch) {
      results.email.text = emailMatch[1];
      results.email.confidence = 0.95;
      return;
    }
    
    // If not found, try each line
    for (const line of lines) {
      const lineMatch = line.match(emailPattern);
      if (lineMatch) {
        results.email.text = lineMatch[1];
        results.email.confidence = 0.95;
        return;
      }
    }
    
    // Look for email with label
    const emailLabelPattern = /(?:email|e-mail|mail):\s*([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i;
    
    // Try each line with the label pattern
    for (const line of lines) {
      const labelMatch = line.match(emailLabelPattern);
      if (labelMatch) {
        results.email.text = labelMatch[1];
        results.email.confidence = 0.98;
        return;
      }
    }
  }

  // Map state name to abbreviation
  getStateAbbreviation(stateName) {
    if (!stateName) return '';
    
    const stateMap = {
      'alabama': 'AL',
      'alaska': 'AK',
      'arizona': 'AZ',
      'arkansas': 'AR',
      'california': 'CA',
      'colorado': 'CO',
      'connecticut': 'CT',
      'delaware': 'DE',
      'florida': 'FL',
      'georgia': 'GA',
      'hawaii': 'HI',
      'idaho': 'ID',
      'illinois': 'IL',
      'indiana': 'IN',
      'iowa': 'IA',
      'kansas': 'KS',
      'kentucky': 'KY',
      'louisiana': 'LA',
      'maine': 'ME',
      'maryland': 'MD',
      'massachusetts': 'MA',
      'michigan': 'MI',
      'minnesota': 'MN',
      'mississippi': 'MS',
      'missouri': 'MO',
      'montana': 'MT',
      'nebraska': 'NE',
      'nevada': 'NV',
      'new hampshire': 'NH',
      'new jersey': 'NJ',
      'new mexico': 'NM',
      'new york': 'NY',
      'north carolina': 'NC',
      'north dakota': 'ND',
      'ohio': 'OH',
      'oklahoma': 'OK',
      'oregon': 'OR',
      'pennsylvania': 'PA',
      'rhode island': 'RI',
      'south carolina': 'SC',
      'south dakota': 'SD',
      'tennessee': 'TN',
      'texas': 'TX',
      'utah': 'UT',
      'vermont': 'VT',
      'virginia': 'VA',
      'washington': 'WA',
      'west virginia': 'WV',
      'wisconsin': 'WI',
      'wyoming': 'WY',
      'swansea': 'MA',  // Common city in Massachusetts
      'boston': 'MA',   // Common city in Massachusetts
      'east boston': 'MA'  // Specific to Logan Airport area
    };
    
    // Check for exact match (case insensitive)
    const normalizedState = stateName.toLowerCase().trim();
    
    // If it's already a valid 2-letter code, return it uppercase
    if (/^[a-z]{2}$/i.test(normalizedState)) {
      return normalizedState.toUpperCase();
    }
    
    return stateMap[normalizedState] || '';
  }
}

// Export the processor
window.AIProcessor = AIProcessor;