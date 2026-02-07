
MISSION:                                                                                                                
  Given 3 specific items, identify the most fitting subject category that encompasses all of them.                                                                                                                                       
  YOUR TASK:                                                                                                              
  Analyze these 3 items: [${itemsList}]                                                                                                     
  Find the common thread - what category, domain, or conceptual space do these all belong to?                
  THE 'AHA' REQUIREMENT:                                                                                                  
  The goal is to surprise and delight with a non-obvious connection. Don't just pick the most literal category.           
  - If given ["Bicycle", "Subway", "Rickshaw"], don't settle for "Transportation" - find "Urban Transportation Methods"   
  - If given ["Katana", "Excalibur", "Lightsaber"], don't say "Weapons" - discover "Legendary Swords Across History and   
  Fiction"                                                                                                                
  - Look for the SPECIFIC, EVOCATIVE category that makes someone say "Oh! I never thought of grouping these that way!"    
                                  
  CRITERIA FOR A GOOD SUBJECT:                                                                                            
  1. SPECIFICITY: The subject should be specific enough to be meaningful (not just "Things" or "Objects")                 
  2. INCLUSIVITY: All 3 items must belong to this category, even in a creative way (e.g. Bad bunny the rapper is a bunny of some sort)
  3. DIMENSIONALITY: The subject should allow for interesting 2D mapping with diverse examples                            
  4. CREATIVE DEPTH: Choose subjects that feel like a 'world' to explore                                        
  5. LATERAL THINKING: Find the surprising angle, not the obvious one                                                     
                                                                                                                          
  EXAMPLES OF GOOD TRANSFORMATIONS:                                                                                       
  - ["Bicycle", "Subway", "Rickshaw"] → "Urban Transportation Methods" OR ""
  - ["Katana", "Excalibur", "Lightsaber"] → "Legendary Swords" (not just "Weapons")              
  - ["Espresso", "Cold Brew", "Turkish Coffee"] → "Coffee Preparation Methods" (not just "Beverages")                     
  - ["Piano", "Theremin", "DJ Controller"] → "Musical Instruments" (not just "Instruments")
  - ["Stonehenge", "Pyramids", "Nazca lines"] → "Monumental object with mythical origins"       

  CONSTRAINTS:                                                                                                            
  - The subject should have room for at least 10-20 other well-known examples                            
  - Avoid  narrow subjects                   
  - MOST IMPORTANT: Find the angle that creates the 'aha moment'                                                          
  IMPORTANT: Return ONLY valid JSON, no markdown, no code blocks, no extra text.                     Return this exact JSON structure:                                                                                       
  {                                                                                                                       
    "subject": "...",                                                                                                     
    "reasoning": "Brief explanation of why this subject fits all 3 items and what makes it interesting"                   
  }`;                                                                                                                     
  } 