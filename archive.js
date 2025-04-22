const popup = document.getElementById('popup');
const contentBlocks = document.querySelectorAll('.popup-content');
let startY = 0, currentY = 0, isDragging = false;

// List click logic
document.querySelectorAll('.list li').forEach(item => {
  item.addEventListener('click', () => {
    const key = item.getAttribute('data-key');
    contentBlocks.forEach(block => block.classList.add('hidden'));
    document.getElementById(key).classList.remove('hidden');
    popup.classList.add('show');
    
    // Reset all interactive elements when switching sections
    resetInteractiveElements();
    
    // Initialize section-specific interactions
    initializeSectionInteractions(key);
  });
});

// Swipe-down-to-close for mobile - from the top area of popup
popup.addEventListener('touchstart', (e) => {
  // Only allow dragging from the top portion of the popup (first 50px)
  const touchY = e.touches[0].clientY;
  const popupRect = popup.getBoundingClientRect();
  const touchRelativeToPopup = touchY - popupRect.top;
  
  if (touchRelativeToPopup <= 50) {
    startY = touchY;
    isDragging = true;
  }
});

popup.addEventListener('touchmove', (e) => {
  if (!isDragging) return;
  currentY = e.touches[0].clientY;
  
  // Add visual feedback during dragging
  const dragDistance = currentY - startY;
  if (dragDistance > 0) {
    popup.style.transform = `translateY(${dragDistance}px)`;
  }
});

popup.addEventListener('touchend', () => {
  if (!isDragging) return;
  isDragging = false;
  
  const dragDistance = currentY - startY;
  const threshold = 100;
  
  if (dragDistance > threshold) {
    // Close the popup
    popup.classList.remove('show');
    popup.style.bottom = '-100%';
    popup.style.transform = '';
    
    setTimeout(() => {
      popup.style.bottom = '';
    }, 300);
  } else {
    // Reset position
    popup.style.transform = '';
  }
});

// Enhanced Timeline with more interactions
const timelineFrame = document.querySelector('.timeline-frame');
function revealTimelineBoxes() {
  const timelineBoxes = document.querySelectorAll('.timeline-box');
  const scrollPosition = timelineFrame.scrollTop;
  const viewportHeight = timelineFrame.clientHeight;

  timelineBoxes.forEach((box, index) => {
    const boxTop = box.offsetTop;
    const boxHeight = box.offsetHeight;
    const boxBottom = boxTop + boxHeight;

    // Calculate visibility based on scroll position
    if (scrollPosition + viewportHeight > boxTop && scrollPosition < boxBottom) {
      box.style.opacity = '1';
      box.style.transform = 'translateY(0)';
    } else {
      box.style.opacity = '0.5';
      box.style.transform = 'translateY(50px)';
    }
  });
}

function setupTimelineInteractions() {
  const timelineBoxes = document.querySelectorAll('.timeline-box');
  
  timelineBoxes.forEach(box => {
    // Add click indicator
    const clickIndicator = document.createElement('div');
    clickIndicator.className = 'click-indicator';
    clickIndicator.textContent = 'Click for details';
    box.appendChild(clickIndicator);

    // Add click event listener
    box.addEventListener('click', function() {
      const details = this.querySelector('.timeline-details');
      if (!details) return; // Skip if no details element exists

      // Close any other open details
      const allDetails = document.querySelectorAll('.timeline-details');
      allDetails.forEach(detail => {
        if (detail !== details && detail.classList.contains('show')) {
          detail.classList.remove('show');
          const parentBox = detail.closest('.timeline-box');
          if (parentBox) {
            parentBox.style.transform = 'translateY(0)';
            parentBox.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
          }
        }
      });

      // Toggle current details
      const isExpanded = details.classList.contains('show');
      if (isExpanded) {
        details.classList.remove('show');
      } else {
        details.classList.add('show');
      }
      
      // Update box appearance
      this.style.transform = isExpanded ? 'translateY(0)' : 'translateY(-10px)';
      this.style.backgroundColor = isExpanded ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.2)';
    });

    // Add hover effects
    box.addEventListener('mouseenter', function() {
      this.style.transform = 'translateY(-5px)';
      this.style.backgroundColor = 'rgba(255, 255, 255, 0.15)';
    });

    box.addEventListener('mouseleave', function() {
      const details = this.querySelector('.timeline-details');
      if (!details || !details.classList.contains('show')) {
        this.style.transform = 'translateY(0)';
        this.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
      }
    });
  });
}

// Initialize timeline functionality
document.addEventListener('DOMContentLoaded', () => {
  const timelineFrame = document.querySelector('.timeline-frame');
  if (timelineFrame) {
    timelineFrame.addEventListener('scroll', revealTimelineBoxes);
    setupTimelineInteractions();
    revealTimelineBoxes(); // Initial reveal
  }
});

// Toggle buttons for expandable content
function setupToggleButtons() {
  const toggleButtons = document.querySelectorAll('.toggle-btn');
  
  toggleButtons.forEach(button => {
    button.addEventListener('click', () => {
      const details = button.previousElementSibling;
      const isHidden = details.classList.contains('hidden');
      
      if (isHidden) {
        details.classList.remove('hidden');
        details.classList.add('show');
        button.textContent = 'Hide Details';
      } else {
        details.classList.remove('show');
        details.classList.add('hidden');
        button.textContent = 'Show Details';
      }
    });
  });
}

// Prototype navigation
function setupPrototypeNavigation() {
  const prototypeButtons = document.querySelectorAll('.prototype-btn');
  const prototypeItems = document.querySelectorAll('.prototype-item');
  
  prototypeButtons.forEach(button => {
    button.addEventListener('click', () => {
      const target = button.getAttribute('data-target');
      
      // Update active button
      prototypeButtons.forEach(btn => btn.classList.remove('active'));
      button.classList.add('active');
      
      // Show target content
      prototypeItems.forEach(item => {
        item.classList.remove('active');
        if (item.id === target) {
          item.classList.add('active');
        }
      });
    });
  });
}

// Feedback timeline animation
function setupFeedbackTimeline() {
  const feedbackItems = document.querySelectorAll('.feedback-item');
  
  feedbackItems.forEach((item, index) => {
    // Add staggered animation delay
    item.style.animationDelay = `${index * 0.2}s`;
    item.classList.add('animate-in');
  });
}

// Use case cards animation
function setupUseCaseCards() {
  const useCaseCards = document.querySelectorAll('.usecase-card');
  
  useCaseCards.forEach((card, index) => {
    // Add staggered animation delay
    card.style.animationDelay = `${index * 0.2}s`;
    card.classList.add('animate-in');
  });
}

// Branding showcase animation
function setupBrandingShowcase() {
  const brandingSections = document.querySelectorAll('.branding-section');
  
  brandingSections.forEach((section, index) => {
    // Add staggered animation delay
    section.style.animationDelay = `${index * 0.3}s`;
    section.classList.add('animate-in');
  });
}

// Reflection cards animation
function setupReflectionCards() {
  const reflectionCards = document.querySelectorAll('.reflection-card');
  
  reflectionCards.forEach((card, index) => {
    // Add staggered animation delay
    card.style.animationDelay = `${index * 0.2}s`;
    card.classList.add('animate-in');
  });
}

// Meeting notes horizontal scroll
function setupMeetingNotes() {
  const frame = document.querySelector('.frame');
  const boxes = document.querySelectorAll('.box1');
  
  // Add scroll snap points
  boxes.forEach(box => {
    box.addEventListener('click', () => {
      // Scroll the box into view
      box.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    });
  });
}

// Reset all interactive elements
function resetInteractiveElements() {
  // Reset toggle buttons
  document.querySelectorAll('.toggle-btn').forEach(button => {
    button.textContent = 'Show Details';
  });
  
  // Reset hidden elements
  document.querySelectorAll('.hidden').forEach(element => {
    if (!element.classList.contains('popup-content')) {
      element.classList.remove('show');
    }
  });
  
  // Reset prototype navigation
  document.querySelectorAll('.prototype-btn').forEach(button => {
    button.classList.remove('active');
  });
  
  document.querySelectorAll('.prototype-item').forEach(item => {
    item.classList.remove('active');
  });
  
  // Reset animation classes
  document.querySelectorAll('.animate-in').forEach(element => {
    element.classList.remove('animate-in');
  });
}

// Initialize section-specific interactions
function initializeSectionInteractions(sectionKey) {
  switch(sectionKey) {
    case 'meeting':
      setupMeetingNotes();
      break;
    case 'research':
      setupToggleButtons();
      break;
    case 'wireframes':
      setupPrototypeNavigation();
      break;
    case 'feedback':
      setupFeedbackTimeline();
      setupToggleButtons();
      break;
    case 'usecases':
      setupUseCaseCards();
      setupToggleButtons();
      break;
    case 'branding':
      setupBrandingShowcase();
      break;
    case 'timeline':
      // Timeline is already set up with scroll event
      break;
    case 'reflection':
      setupReflectionCards();
      break;
  }
}

// Language Switching
function updateLanguage(lang) {
  const contentKeys = Object.keys(translations[lang]);

  contentKeys.forEach((key) => {
    const section = translations[lang][key];

    const popupEl = document.getElementById(key);
    if (popupEl) {
      const titleEl = popupEl.querySelector('h2');
      if (titleEl) titleEl.textContent = section.title;

      const contentEl = popupEl.querySelector('p');
      if (contentEl && typeof section.content === 'string') {
        contentEl.textContent = section.content;
      }

      if (key === "timeline") {
        const timelineBoxes = popupEl.querySelectorAll('.timeline-box');
        section.content.forEach((line, i) => {
          if (timelineBoxes[i]) timelineBoxes[i].textContent = line;
        });
      }
    }

    const listItem = document.querySelector(`.list li[data-key="${key}"]`);
    if (listItem) listItem.textContent = section.title;

    listItem.style.fontSize = (lang === 'ENG') ? '20px' : '18px';
  
  });

  // Highlight selected button
  const eng = document.getElementById('lang-eng');
  const kor = document.getElementById('lang-kor');

  eng.classList.toggle('active', lang === 'ENG');
  kor.classList.toggle('active', lang === 'KOR');


}
// Add CSS animations
const style = document.createElement('style');
style.textContent = `
  @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translateY(30px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  .animate-in {
    animation: fadeInUp 0.6s ease forwards;
    opacity: 0;
  }
`;
document.head.appendChild(style);

// Initialize all sections on page load
document.addEventListener('DOMContentLoaded', () => {
  // Set up language
  updateLanguage('ENG');
  
  // Set up initial interactions
  setupToggleButtons();
  setupPrototypeNavigation();
  setupMeetingNotes();
  
  // Add more content to timeline boxes
  const timelineBoxes = document.querySelectorAll('.timeline-box');
  
  timelineBoxes.forEach((box, index) => {
    // Add a click indicator
    const content = box.querySelector('.timeline-content');
    if (content) {
      content.innerHTML += '<div class="click-indicator">Click for more details</div>';
    }
    
    // Add more details to each timeline box
    const detailsContent = box.querySelector('.timeline-details-content');
    if (detailsContent) {
      // Add a random fact or detail based on the timeline item
      const randomFacts = [
        "This milestone was completed ahead of schedule",
        "Team members worked overtime to meet this deadline",
        "This phase received positive feedback from stakeholders",
        "A major pivot occurred during this phase",
        "This was the most challenging part of the project",
        "The team celebrated this achievement with a small party",
        "This phase required collaboration with external partners",
        "A new team member joined during this phase"
      ];

      const randomFact = randomFacts[Math.floor(Math.random() * randomFacts.length)];
      
      const newItem = document.createElement('div');
      newItem.className = 'timeline-details-item';
      newItem.innerHTML = `
        <div class="timeline-details-icon">💡</div>
        <div class="timeline-details-text">${randomFact}</div>
      `;
      
      detailsContent.appendChild(newItem);
    }
  });
});

function box1_open() {
  const box = document.querySelector('.box1');  // Select the box1 element
  const currentHeight = window.getComputedStyle(box).height;  // Get the current computed height
  
  // Toggle height between 250px and 400px
  if (currentHeight === '1000px') {
    box.style.height = '250px';  // Collapse the box back to 250px
  } else {
    box.style.height = '1000px';  // Expand the box to 400px
  }
}
