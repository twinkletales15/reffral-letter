// ========== MULTI-LANGUAGE SUPPORT ==========
const translations = {
  en: { patient: 'Patient', age: 'Age', sex: 'Sex', phone: 'Phone', email: 'Email' },
  hi: { patient: 'मरीज़', age: 'उम्र', sex: 'लिंग', phone: 'फ़ोन', email: 'ईमेल' },
  ta: { patient: 'நோயாளர்', age: 'வயது', sex: 'பாலினம்', phone: 'தொலைபேசி', email: 'மின்னஞ்சல்' },
  te: { patient: 'రోగి', age: 'వయస్సు', sex: 'లింగం', phone: 'ఫోన్', email: 'ఈమెయిల్' },
  ml: { patient: 'രോഗി', age: 'പ്രായം', sex: 'ലിംഗം', phone: 'ഫോൺ', email: 'ഇമെയിൽ' },
  kn: { patient: 'ರೋಗಿ', age: 'ವಯಸ್ಸು', sex: 'ಲಿಂಗ', phone: 'ಫೋನ್', email: 'ಇಮೇಲ್' },
  bn: { patient: 'রোগী', age: 'বয়স', sex: 'লিঙ্গ', phone: 'ফোন', email: 'ইমেল' },
  mr: { patient: 'रुग्ण', age: 'वय', sex: 'लिंग', phone: 'फोन', email: 'ईमेल' },
  gu: { patient: 'દર્દી', age: 'ઉંમર', sex: 'લિંગ', phone: 'ફોન', email: 'ઇમેઇલ' },
  pa: { patient: 'ਮਰੀਜ਼', age: 'ਉਮਰ', sex: 'ਲਿੰਗ', phone: 'ਫ਼ੋਨ', email: 'ਈਮੇਲ' }
};

const languageNames = {
  en: 'English',
  hi: 'Hindi',
  ta: 'Tamil',
  te: 'Telugu',
  ml: 'Malayalam',
  kn: 'Kannada',
  bn: 'Bengali',
  mr: 'Marathi',
  gu: 'Gujarati',
  pa: 'Punjabi'
};

let currentLanguage = 'en';

document.getElementById('languageSelect').addEventListener('change', (e) => {
  currentLanguage = e.target.value;
  updateRecognitionLanguage();
  addAuditLog(`Language changed to ${e.target.value.toUpperCase()}`);
  autoSave();
});

const appShell = document.getElementById('appShell');

// ========== QUICK DATE/TIME INSERT ==========
const patientDetailDate = document.getElementById('patientDetailDate');
const patientDetailTime = document.getElementById('patientDetailTime');
const patientAgeInput = document.getElementById('patientAge');
const patientDobInput = document.getElementById('patientDob');

function getLocalDateValue(date) {
  return date.toLocaleDateString('en-CA');
}

function getLocalTimeValue(date) {
  return date.toTimeString().slice(0, 5);
}

function setPatientDateTime(forceDate = false) {
  const now = new Date();
  if (forceDate || !patientDetailDate.value) {
    patientDetailDate.value = getLocalDateValue(now);
  }
  patientDetailTime.value = getLocalTimeValue(now);
}

setPatientDateTime();
setInterval(() => setPatientDateTime(false), 30000);

function calculateAgeFromDob(dobValue) {
  if (!dobValue) return '';
  const dob = new Date(`${dobValue}T00:00`);
  if (Number.isNaN(dob.getTime())) return '';

  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const monthDifference = today.getMonth() - dob.getMonth();
  const birthdayNotReached = monthDifference < 0 || (monthDifference === 0 && today.getDate() < dob.getDate());
  if (birthdayNotReached) age -= 1;

  return age >= 0 ? String(age) : '';
}

function updateAgeFromDob() {
  const age = calculateAgeFromDob(patientDobInput.value);
  if (!age) return;
  patientAgeInput.value = age;
  patientAgeInput.dispatchEvent(new Event('input', { bubbles: true }));
  patientAgeInput.dispatchEvent(new Event('change', { bubbles: true }));
}

patientDobInput.addEventListener('change', updateAgeFromDob);

// ========== AUTOMATIC SPECIALTY SUGGESTION ==========
const specialtySelect = document.getElementById('specialty');
const specialtySuggestion = document.getElementById('specialtySuggestion');
let lastAutoSuggestedSpecialty = '';
let specialtySuggestionChanging = false;
const specialtyRules = [
  {
    specialty: 'Cardiology',
    keywords: ['chest pain', 'heart pain', 'palpitation', 'palpitations', 'shortness of breath on exertion', 'angina', 'syncope', 'ecg', 'troponin', 'hypertension']
  },
  {
    specialty: 'Pulmonology',
    keywords: ['cough', 'wheezing', 'breathlessness', 'shortness of breath', 'asthma', 'copd', 'pneumonia', 'spo2', 'oxygen']
  },
  {
    specialty: 'Neurology',
    keywords: ['headache', 'migraine', 'seizure', 'weakness', 'numbness', 'stroke', 'dizziness', 'vertigo', 'paralysis', 'loss of consciousness']
  },
  {
    specialty: 'Gastroenterology',
    keywords: ['abdominal pain', 'stomach pain', 'vomiting', 'diarrhea', 'constipation', 'jaundice', 'blood in stool', 'liver', 'gastritis']
  },
  {
    specialty: 'Orthopaedics',
    keywords: ['fracture', 'joint pain', 'knee pain', 'back pain', 'shoulder pain', 'bone pain', 'sprain', 'arthritis', 'injury']
  },
  {
    specialty: 'Nephrology',
    keywords: ['kidney', 'renal', 'proteinuria', 'high creatinine', 'hematuria', 'dialysis', 'ckd', 'urea']
  },
  {
    specialty: 'ENT',
    keywords: ['ear pain', 'hearing loss', 'sore throat', 'tonsil', 'sinus', 'nose bleed', 'vertigo', 'throat pain', 'nasal']
  },
  {
    specialty: 'Oncology',
    keywords: ['cancer', 'tumor', 'mass', 'lump', 'chemotherapy', 'malignancy', 'weight loss', 'biopsy']
  },
  {
    specialty: 'General Surgery',
    keywords: ['appendix', 'appendicitis', 'hernia', 'gallstone', 'abscess', 'surgical wound', 'acute abdomen']
  }
];

function getClinicalTextForSpecialty() {
  return [
    'medicalHistory',
    'physicalExam',
    'investigations',
    'diagnosis',
    'message'
  ].map(id => document.getElementById(id)?.value || '').join(' ').toLowerCase();
}

function updateSpecialtyFromClinicalText() {
  const text = getClinicalTextForSpecialty();
  if (!text.trim()) {
    if (specialtySuggestion) {
      specialtySuggestion.textContent = 'Auto specialty suggestion will appear after entering clinical details.';
    }
    return;
  }

  const matches = specialtyRules
    .map(rule => ({
      ...rule,
      matchedKeywords: rule.keywords.filter(keyword => text.includes(keyword))
    }))
    .filter(rule => rule.matchedKeywords.length > 0)
    .sort((a, b) => b.matchedKeywords.length - a.matchedKeywords.length);

  const match = matches[0];
  if (!match) {
    if (specialtySuggestion) {
      specialtySuggestion.textContent = 'No specialty suggestion yet. Add more clinical details.';
    }
    return;
  }

  const canAutoApply = !specialtySelect.value || specialtySelect.value === lastAutoSuggestedSpecialty;
  if (canAutoApply && specialtySelect.value !== match.specialty) {
    specialtySuggestionChanging = true;
    specialtySelect.value = match.specialty;
    specialtySelect.dispatchEvent(new Event('change', { bubbles: true }));
    specialtySuggestionChanging = false;
    lastAutoSuggestedSpecialty = match.specialty;
    addAuditLog(`Specialty auto-suggested: ${match.specialty}`);
  }

  if (specialtySuggestion) {
    const actionText = canAutoApply ? 'Selected' : 'Suggested';
    specialtySuggestion.textContent = `${actionText}: ${match.specialty} based on "${match.matchedKeywords.slice(0, 3).join(', ')}".`;
  }
}

specialtySelect.addEventListener('change', () => {
  if (!specialtySuggestionChanging) {
    lastAutoSuggestedSpecialty = '';
  }
});

['medicalHistory', 'physicalExam', 'investigations', 'diagnosis', 'message'].forEach(id => {
  document.getElementById(id)?.addEventListener('input', updateSpecialtyFromClinicalText);
});

// ========== DOCTOR PROFILE ==========
const profileModal = document.getElementById('profileModal');
const doctorProfileBtn = document.getElementById('doctorProfileBtn');
const doctorName = document.getElementById('doctorName');
const doctorLicense = document.getElementById('doctorLicense');
const doctorHospital = document.getElementById('doctorHospital');
const doctorSignature = document.getElementById('doctorSignature');

doctorProfileBtn.addEventListener('click', () => {
  const profile = JSON.parse(localStorage.getItem('doctorProfile')) || {};
  doctorName.value = profile.name || '';
  doctorLicense.value = profile.license || '';
  doctorHospital.value = profile.hospital || '';
  profileModal.classList.remove('hidden');
});

document.getElementById('saveProfileBtn').addEventListener('click', () => {
  const profile = {
    name: doctorName.value,
    license: doctorLicense.value,
    hospital: doctorHospital.value
  };
  localStorage.setItem('doctorProfile', JSON.stringify(profile));
  addAuditLog(`Doctor profile updated: ${profile.name}`);
  profileModal.classList.add('hidden');
  autoSave();
});

document.getElementById('cancelProfileBtn').addEventListener('click', () => {
  profileModal.classList.add('hidden');
});

document.getElementById('closeProfileModal').addEventListener('click', () => {
  profileModal.classList.add('hidden');
});

profileModal.addEventListener('click', (e) => {
  if (e.target === profileModal) profileModal.classList.add('hidden');
});

const addAuditLog = () => {};
const updateAuditDisplay = () => {};

// ========== FILE ATTACHMENTS ==========
const fileAttachment = document.getElementById('fileAttachment');
const attachmentList = document.getElementById('attachmentList');
let attachments = [];

fileAttachment.addEventListener('change', (e) => {
  Array.from(e.target.files).forEach(file => {
    attachments.push(file);
    const div = document.createElement('div');
    div.className = 'attachment-item';
    div.innerHTML = `
      <span>📎 ${file.name} (${(file.size / 1024).toFixed(1)} KB)</span>
      <button onclick="removeAttachment('${file.name}')" style="background:none;border:none;color:red;cursor:pointer;">✕</button>
    `;
    attachmentList.appendChild(div);
  });
  addAuditLog(`Attached file: ${e.target.files[0]?.name}`);
});

function removeAttachment(name) {
  attachments = attachments.filter(f => f.name !== name);
  updateAttachmentList();
  addAuditLog(`Removed attachment: ${name}`);
}

function updateAttachmentList() {
  attachmentList.innerHTML = '';
  attachments.forEach(file => {
    const div = document.createElement('div');
    div.className = 'attachment-item';
    div.innerHTML = `<span>📎 ${file.name}</span>`;
    attachmentList.appendChild(div);
  });
}

// ========== UNDO/REDO ==========
let history = [];
let historyIndex = -1;

function saveState() {
  const state = {
    patientName: document.getElementById('patientName').value,
    output: document.getElementById('output').textContent
  };
  history = history.slice(0, historyIndex + 1);
  history.push(state);
  historyIndex++;
  updateUndoRedoButtons();
}

document.getElementById('undoBtn').addEventListener('click', () => {
  if (historyIndex > 0) {
    historyIndex--;
    restoreState(history[historyIndex]);
    updateUndoRedoButtons();
    addAuditLog('Undo action');
  }
});

document.getElementById('redoBtn').addEventListener('click', () => {
  if (historyIndex < history.length - 1) {
    historyIndex++;
    restoreState(history[historyIndex]);
    updateUndoRedoButtons();
    addAuditLog('Redo action');
  }
});

function restoreState(state) {
  document.getElementById('patientName').value = state.patientName;
  document.getElementById('output').textContent = state.output;
}

function updateUndoRedoButtons() {
  document.getElementById('undoBtn').disabled = historyIndex <= 0;
  document.getElementById('redoBtn').disabled = historyIndex >= history.length - 1;
}

// ========== COPY TO CLIPBOARD ==========
document.getElementById('copyLetterBtn').addEventListener('click', () => {
  const text = document.getElementById('output').textContent;
  navigator.clipboard.writeText(text).then(() => {
    alert('Letter copied to clipboard!');
    addAuditLog('Letter copied to clipboard');
  });
});

// ========== DIGITAL SIGNATURE ==========
const signatureModal = document.getElementById('signatureModal');
const signLetterBtn = document.getElementById('signLetterBtn');
let signaturePad = null;

signLetterBtn.addEventListener('click', () => {
  signatureModal.classList.remove('hidden');
  setTimeout(() => {
    const canvas = document.getElementById('signaturePad');
    signaturePad = new SignaturePad(canvas);
  }, 100);
});

document.getElementById('clearSignatureBtn').addEventListener('click', () => {
  if (signaturePad) signaturePad.clear();
});

document.getElementById('saveSignatureBtn').addEventListener('click', () => {
  if (signaturePad && !signaturePad.isEmpty()) {
    localStorage.setItem('signature', signaturePad.toDataURL());
    alert('Signature saved!');
    signatureModal.classList.add('hidden');
    addAuditLog('Digital signature added');
  } else {
    alert('Please sign before saving.');
  }
});

document.getElementById('cancelSignatureBtn').addEventListener('click', () => {
  signatureModal.classList.add('hidden');
});

document.getElementById('closeSignatureModal').addEventListener('click', () => {
  signatureModal.classList.add('hidden');
});

// ========== VOICE RECORDING ==========
const recordBtn = document.getElementById('recordBtn');
const stopRecordBtn = document.getElementById('stopRecordBtn');
const playbackBtn = document.getElementById('playbackBtn');
const dictateBtn = document.getElementById('dictateBtn');
const deleteRecordingBtn = document.getElementById('deleteRecordingBtn');
const recordingStatus = document.getElementById('recordingStatus');
const audioPlayback = document.getElementById('audioPlayback');
const llmApiKeyInput = document.getElementById('llmApiKey');
const GEMINI_MODEL = 'gemini-2.5-flash';
const GEMINI_API_KEY_STORAGE = 'gemini_api_key';
const LEGACY_LLM_API_KEY_STORAGE = 'llm_api_key';

let mediaRecorder;
let audioChunks = [];
let audioBlob;
let recognition = null;
let dictationActive = false;
let voiceLetterInProgress = false;
let currentDictationTargetId = '';
let currentDictationButton = null;

const dictationLanguageMap = {
  en: 'en-IN',
  hi: 'hi-IN',
  ta: 'ta-IN',
  te: 'te-IN',
  ml: 'ml-IN',
  kn: 'kn-IN',
  bn: 'bn-IN',
  mr: 'mr-IN',
  gu: 'gu-IN',
  pa: 'pa-IN'
};

const dictationTargetLabels = {
  medicalHistory: 'Current Symptoms',
  physicalExam: 'Physical Examination',
  investigations: 'Result',
  diagnosis: 'Report / Impression',
  message: 'Referral Reason',
  medications: 'Current Medicines',
  allergies: 'Allergies'
};

function updateRecognitionLanguage() {
  if (recognition) {
    recognition.lang = dictationLanguageMap[currentLanguage] || 'en-IN';
  }
}

function canUseSpeechRecognition() {
  return 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window;
}

function resetClinicalMicButtons() {
  document.querySelectorAll('.clinical-mic-btn').forEach(button => {
    button.classList.remove('active');
    button.textContent = '🎙️ Speak';
  });
}

function createSpeechRecognition() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) return null;
  const recog = new SpeechRecognition();
  recog.continuous = true;
  recog.interimResults = true;
  recog.lang = dictationLanguageMap[currentLanguage] || 'en-IN';

  recog.onstart = () => {
    dictationActive = true;
    dictateBtn.textContent = '🛑 Stop Dictation';
    resetClinicalMicButtons();
    if (currentDictationButton) {
      currentDictationButton.classList.add('active');
      currentDictationButton.textContent = '■ Stop';
    }
    const targetLabel = dictationTargetLabels[currentDictationTargetId];
    recordingStatus.textContent = targetLabel
      ? `Dictation active for ${targetLabel}. Speak now.`
      : 'Dictation active — speaking will fill the active field or referral reason.';
    addAuditLog('Voice dictation started');
  };

  recog.onresult = (event) => {
    let interimTranscript = '';
    let finalTranscript = '';
    for (let i = event.resultIndex; i < event.results.length; i++) {
      const result = event.results[i];
      const transcript = result[0].transcript;
      if (result.isFinal) {
        finalTranscript += transcript;
      } else {
        interimTranscript += transcript;
      }
    }
    if (finalTranscript) {
      recordingStatus.textContent = `Dictated: ${finalTranscript}`;
      appendDictationText(finalTranscript);
    } else {
      recordingStatus.textContent = `Listening... ${interimTranscript}`;
    }
  };

  recog.onerror = (event) => {
    recordingStatus.textContent = `Dictation error: ${event.error}`;
    addAuditLog(`Voice dictation error: ${event.error}`);
  };

  recog.onend = () => {
    dictationActive = false;
    dictateBtn.textContent = '🗣️ Dictate';
    resetClinicalMicButtons();
    recordingStatus.textContent = 'Dictation stopped.';
    currentDictationTargetId = '';
    currentDictationButton = null;
    addAuditLog('Voice dictation stopped');
  };

  return recog;
}

function getDictationTarget() {
  if (currentDictationTargetId) {
    const selectedTarget = document.getElementById(currentDictationTargetId);
    if (selectedTarget) return selectedTarget;
  }

  const active = document.activeElement;
  if (active && (active.tagName === 'TEXTAREA' || active.tagName === 'INPUT') && active.id !== 'fileAttachment') {
    return active;
  }
  return document.getElementById('message');
}

function startDictation(targetId = '', button = null) {
  if (!canUseSpeechRecognition()) {
    recordingStatus.textContent = 'Speech recognition is not supported in this browser.';
    return;
  }

  if (!recognition) {
    recognition = createSpeechRecognition();
  }

  if (!recognition) {
    recordingStatus.textContent = 'Speech recognition is not available in this browser.';
    return;
  }

  updateRecognitionLanguage();

  if (dictationActive) {
    recognition.stop();
    return;
  }

  currentDictationTargetId = targetId;
  currentDictationButton = button;

  const target = targetId ? document.getElementById(targetId) : null;
  if (target) {
    target.focus();
    target.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  recognition.start();
}

function setFieldValue(id, value) {
  if (typeof value !== 'string' || !value.trim()) return;
  const field = document.getElementById(id);
  if (!field) return;
  field.value = value.trim();
  field.dispatchEvent(new Event('input', { bubbles: true }));
  field.dispatchEvent(new Event('change', { bubbles: true }));
}

function setSelectValue(id, value) {
  if (typeof value !== 'string' || !value.trim()) return;
  const select = document.getElementById(id);
  if (!select) return;

  const match = [...select.options].find(option => (
    option.value.toLowerCase() === value.trim().toLowerCase() ||
    option.textContent.trim().toLowerCase() === value.trim().toLowerCase()
  ));

  if (!match) return;
  select.value = match.value;
  select.dispatchEvent(new Event('change', { bubbles: true }));
}

function applyLlmReferralFields(fields) {
  if (!fields || typeof fields !== 'object') return;
  setFieldValue('patientName', fields.patientName);
  setFieldValue('patientAge', fields.patientAge);
  setFieldValue('patientPhone', fields.patientPhone);
  setFieldValue('patientEmail', fields.patientEmail);
  setFieldValue('receivingDocName', fields.receivingDoctorName);
  setFieldValue('hospital', fields.hospital);
  setFieldValue('medicalHistory', fields.currentSymptoms);
  setFieldValue('physicalExam', fields.physicalExam);
  setFieldValue('investigations', fields.result);
  setFieldValue('diagnosis', fields.report);
  setFieldValue('message', fields.referralReason);
  setFieldValue('medications', fields.medications);
  setFieldValue('allergies', fields.allergies);
  setSelectValue('patientSex', fields.patientSex);
  setSelectValue('urgency', fields.urgency);
  setSelectValue('specialty', fields.specialty);
  autoSave();
}

function readLlmJson(text) {
  try {
    return JSON.parse(text);
  } catch {
    const match = text.match(/\{[\s\S]*\}/);
    return match ? JSON.parse(match[0]) : null;
  }
}

function getResponseText(data) {
  if (data.output_text) return data.output_text;
  if (data.candidates) {
    return data.candidates
      .flatMap(candidate => candidate.content?.parts || [])
      .map(part => part.text || '')
      .join('\n')
      .trim();
  }
  return (data.output || [])
    .flatMap(item => item.content || [])
    .map(content => content.text || '')
    .join('\n')
    .trim();
}

async function generateReferralFromVoiceWithGemini(dictatedText) {
  const apiKey = llmApiKeyInput?.value.trim() || localStorage.getItem(GEMINI_API_KEY_STORAGE) || '';
  if (!apiKey) {
    throw new Error('Enter your Gemini API key before using voice dictation.');
  }

  localStorage.setItem(GEMINI_API_KEY_STORAGE, apiKey);
  localStorage.removeItem(LEGACY_LLM_API_KEY_STORAGE);
  recordingStatus.textContent = 'Gemini is filling the referral fields from your voice...';

  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': apiKey
    },
    body: JSON.stringify({
      contents: [{
        role: 'user',
        parts: [{
          text: `You are helping a clinician fill a referral letter form from microphone dictation.
Return only valid JSON with these keys:
currentSymptoms, physicalExam, result, report, referralReason, urgency, specialty.

Map spoken sections to the matching form buttons:
- "Current Symptoms" -> currentSymptoms
- "Physical Examination" -> physicalExam
- "Result" -> result
- "Report" -> report
- "Referral Reason" -> referralReason

Use only these urgency values when appropriate: Routine, Urgent, Emergency.
Use only these specialties when appropriate: Cardiology, Neurology, Orthopaedics, Gastroenterology, General Surgery, Nephrology, Pulmonology, ENT, Oncology.
Do not invent details. Leave unknown fields as empty strings.

Dictation:
${dictatedText}`
        }]
      }],
      generationConfig: {
        temperature: 0.2,
        responseMimeType: 'application/json'
      }
    })
  });

  if (!response.ok) {
    throw new Error(`Gemini request failed (${response.status})`);
  }

  const data = await response.json();
  const fields = readLlmJson(getResponseText(data));
  if (!fields) {
    throw new Error('Gemini did not return readable referral fields.');
  }
  applyLlmReferralFields(fields);
}

async function buildReferralFromVoice(dictatedText) {
  if (voiceLetterInProgress) return;
  voiceLetterInProgress = true;

  try {
    await generateReferralFromVoiceWithGemini(dictatedText);
    generateLetter();
    recordingStatus.textContent = 'Voice converted to text, fields filled by Gemini AI, and referral generated.';
  } catch (error) {
    console.error(error);
    recordingStatus.textContent = error.message || 'Gemini AI could not generate output. Check the API key or network.';
  } finally {
    voiceLetterInProgress = false;
  }
}

function appendDictationText(text) {
  const target = getDictationTarget();
  target.value = target.value ? `${target.value} ${text}` : text;
  target.dispatchEvent(new Event('input', { bubbles: true }));
  target.dispatchEvent(new Event('change', { bubbles: true }));
  autoSave();

  if (currentDictationTargetId) {
    const targetLabel = dictationTargetLabels[currentDictationTargetId] || 'selected box';
    generateLetter();
    recordingStatus.textContent = `Voice text added to ${targetLabel} and referral output updated.`;
    return;
  }

  const apiKey = llmApiKeyInput?.value.trim() || localStorage.getItem(GEMINI_API_KEY_STORAGE) || '';
  if (!apiKey) {
    recordingStatus.textContent = 'Voice text added. Enter Gemini API key if you want AI to fill all fields and generate the letter.';
    return;
  }

  buildReferralFromVoice(text);
}

document.querySelectorAll('.clinical-focus-btn').forEach(button => {
  button.addEventListener('click', () => {
    const target = document.getElementById(button.dataset.clinicalTarget);
    if (target) {
      target.focus();
      target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  });
});

document.querySelectorAll('[data-dictate-target]').forEach(button => {
  button.addEventListener('click', () => {
    startDictation(button.dataset.dictateTarget, button);
  });
});

dictateBtn.addEventListener('click', () => {
  startDictation();
});

recordBtn.addEventListener('click', async () => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorder = new MediaRecorder(stream);
    audioChunks = [];

    mediaRecorder.addEventListener('dataavailable', (e) => {
      if (e.data.size > 0) audioChunks.push(e.data);
    });

    mediaRecorder.addEventListener('stop', () => {
      audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
      audioPlayback.src = URL.createObjectURL(audioBlob);
      audioPlayback.hidden = false;
      playbackBtn.disabled = false;
      deleteRecordingBtn.disabled = false;
      recordingStatus.textContent = 'Recording saved. Play or delete to record again.';
      stream.getTracks().forEach(track => track.stop());
      addAuditLog('Voice recording saved');
      autoSave();
    });

    mediaRecorder.start();
    recordBtn.disabled = true;
    stopRecordBtn.disabled = false;
    recordingStatus.textContent = 'Recording in progress...';
    addAuditLog('Voice recording started');
  } catch (error) {
    recordingStatus.textContent = 'Microphone access denied.';
  }
});

stopRecordBtn.addEventListener('click', () => {
  if (mediaRecorder?.state === 'recording') mediaRecorder.stop();
});

playbackBtn.addEventListener('click', () => {
  if (audioPlayback.src) audioPlayback.play();
});

deleteRecordingBtn.addEventListener('click', () => {
  audioBlob = null;
  audioChunks = [];
  audioPlayback.src = '';
  audioPlayback.hidden = true;
  playbackBtn.disabled = true;
  deleteRecordingBtn.disabled = true;
  recordingStatus.textContent = 'Recording deleted.';
  addAuditLog('Voice recording deleted');
  autoSave();
});

// ========== PATIENT HISTORY TEMPLATES ==========
const historyTemplates = {
  diabetes: `Type 2 Diabetes Mellitus diagnosed 5 years ago. Currently managed with metformin 500mg BID and insulin glargine 30 units nightly. HbA1c last measured at 7.2%. Patient reports good medication adherence but struggles with dietary compliance. Recent episode of hypoglycemia requiring ER visit. Family history positive for diabetes in both parents.`,
  
  hypertension: `Essential hypertension diagnosed 8 years ago. Current medications: lisinopril 20mg daily, amlodipine 5mg daily. BP readings averaging 145/85 mmHg at home. Last clinic visit showed 150/90 mmHg. Patient reports occasional headaches and dizziness. No evidence of end-organ damage on recent echocardiogram and renal function tests.`,
  
  cardiac: `History of coronary artery disease with PCI to LAD 3 years ago. Current medications: aspirin 81mg daily, atorvastatin 40mg nightly, metoprolol 50mg BID, lisinopril 10mg daily. Recent stress test showed no inducible ischemia. Last echocardiogram showed EF 55% with mild diastolic dysfunction. Patient reports good exercise tolerance, walks 2 miles daily.`,
  
  respiratory: `Chronic obstructive pulmonary disease (COPD) GOLD stage 2, diagnosed 10 years ago. Current medications: tiotropium 18mcg daily, albuterol MDI PRN. FEV1/FVC ratio 0.65, FEV1 65% predicted. Quit smoking 5 years ago after 40 pack-year history. Reports 2-3 exacerbations per year requiring oral steroids. Home oxygen not required.`,
  
  orthopedic: `Right knee osteoarthritis diagnosed 4 years ago. Pain rated 7/10 on VAS scale. Has tried NSAIDs, physical therapy, and intra-articular corticosteroid injections with temporary relief. X-rays show joint space narrowing and osteophyte formation. Patient reports difficulty with stairs and prolonged walking. Considering surgical evaluation for total knee replacement.`,
  
  neurological: `Migraine headaches with aura, occurring 4-6 times per month. Typical triggers include stress, lack of sleep, and certain foods. Current prophylactic treatment with propranolol 80mg BID and acute treatment with sumatriptam 100mg. Recent MRI brain showed no abnormalities. Patient reports partial relief with current regimen but breakthrough headaches persist.`,
  
  gastrointestinal: `Irritable bowel syndrome with constipation predominant pattern, diagnosed 7 years ago. Symptoms include abdominal pain, bloating, and infrequent bowel movements (2-3 times per week). Has tried fiber supplements, osmotic laxatives, and antispasmodics with variable success. Colonoscopy 2 years ago was normal. Patient reports symptom exacerbation with stress and low-fiber diet.`,
  
  dermatological: `Atopic dermatitis since childhood, currently well-controlled. Uses emollients daily and topical corticosteroids PRN for flares. Recent flare triggered by stress. No secondary infection noted. Patient educated on trigger avoidance and proper skin care. Considering referral for patch testing if symptoms persist.`,
  
  mental_health: `Major depressive disorder, recurrent, moderate, diagnosed 3 years ago. Currently treated with sertraline 100mg daily with good response. PHQ-9 score improved from 18 to 6 over 6 months. Patient reports improved sleep, appetite, and energy. Attends weekly therapy sessions. No suicidal ideation. Stable on current regimen.`,
  
  cancer: `Breast cancer (invasive ductal carcinoma) diagnosed 2 years ago, stage IIA. Completed lumpectomy, adjuvant chemotherapy (AC-T regimen), and radiation therapy. Currently on tamoxifen 20mg daily for 5 years. Recent follow-up mammogram and bone scan negative for recurrence. Patient reports mild hot flashes and joint pain as side effects. Regular oncology follow-up every 3 months.`
};

const historyTemplateSelect = document.getElementById('historyTemplate');
if (historyTemplateSelect) {
  historyTemplateSelect.addEventListener('change', (e) => {
    if (e.target.value && historyTemplates[e.target.value]) {
      document.getElementById('medicalHistory').value = historyTemplates[e.target.value];
      autoSave();
    }
  });
}

// ========== FOLLOW-UP SCHEDULING ==========
document.getElementById('followUpDate').addEventListener('change', autoSave);
document.getElementById('followUpReason').addEventListener('change', autoSave);
document.getElementById('appointmentType').addEventListener('change', autoSave);

// ========== CLINICAL GUIDELINES ==========
const guidelineUrls = {
  diabetes: 'https://diabetesjournals.org/care/article/46/Supplement_1/S1/148059/1-Standards-of-Medical-Care-in-Diabetes-2023',
  hypertension: 'https://www.ahajournals.org/doi/10.1161/HYP.0000000000000065',
  cardiac: 'https://www.ahajournals.org/doi/10.1161/CIR.0000000000001038',
  cancer: 'https://www.nccn.org/guidelines',
  asthma: 'https://ginasthma.org/wp-content/uploads/2023/06/GINA-2023-Full-report_23_06_06-WMS.pdf',
  copd: 'https://goldcopd.org/2023-gold-report/',
  stroke: 'https://www.ahajournals.org/doi/10.1161/STR.0000000000000097',
  depression: 'https://www.apa.org/depression-guideline'
};

document.getElementById('viewGuidelineBtn').addEventListener('click', () => {
  const selected = document.getElementById('clinicalGuidelines').value;
  if (selected && guidelineUrls[selected]) {
    window.open(guidelineUrls[selected], '_blank');
  } else {
    alert('Please select a clinical guideline first.');
  }
});

// ========== CONSENT FORMS ==========
const consentTemplates = {
  procedure: {
    title: 'PROCEDURE CONSENT FORM',
    content: `
<h3>PROCEDURE INFORMATION</h3>
<p><strong>Procedure:</strong> [Procedure Name]</p>
<p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
<p><strong>Physician:</strong> ${JSON.parse(localStorage.getItem('doctorProfile'))?.name || '[Physician Name]'}</p>

<h3>PATIENT INFORMATION</h3>
<p><strong>Patient Name:</strong> ${document.getElementById('patientName').value || '[Patient Name]'}</p>
<p><strong>Date of Birth:</strong> [Patient DOB]</p>
<p><strong>Medical Record Number:</strong> [MRN]</p>

<h3>PROCEDURE DESCRIPTION</h3>
<p>I hereby authorize ${JSON.parse(localStorage.getItem('doctorProfile'))?.name || '[Physician Name]'} to perform the following procedure:</p>
<p>[Detailed description of the procedure, including risks, benefits, and alternatives]</p>

<h3>RISKS AND COMPLICATIONS</h3>
<p>I understand that while this procedure is designed to help me, all medical procedures carry some risks. These may include but are not limited to:</p>
<ul>
<li>Infection</li>
<li>Bleeding</li>
<li>Adverse reaction to anesthesia</li>
<li>Damage to surrounding tissues or organs</li>
<li>Need for additional procedures</li>
</ul>

<h3>ALTERNATIVES</h3>
<p>I understand that alternatives to this procedure include:</p>
<ul>
<li>No treatment</li>
<li>Medical management</li>
<li>Other procedures: [List alternatives]</li>
</ul>

<h3>PATIENT CONSENT</h3>
<p>I have been given the opportunity to ask questions about the procedure, and all my questions have been answered to my satisfaction. I understand the risks, benefits, and alternatives to the procedure. I voluntarily consent to the procedure described above.</p>

<p><strong>Patient Signature:</strong> ___________________________ <strong>Date:</strong> ___________</p>
<p><strong>Witness Signature:</strong> ___________________________ <strong>Date:</strong> ___________</p>
<p><strong>Physician Signature:</strong> ___________________________ <strong>Date:</strong> ___________</p>
`
  },
  
  treatment: {
    title: 'TREATMENT CONSENT FORM',
    content: `
<h3>TREATMENT INFORMATION</h3>
<p><strong>Treatment:</strong> [Treatment Name]</p>
<p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
<p><strong>Physician:</strong> ${JSON.parse(localStorage.getItem('doctorProfile'))?.name || '[Physician Name]'}</p>

<h3>PATIENT INFORMATION</h3>
<p><strong>Patient Name:</strong> ${document.getElementById('patientName').value || '[Patient Name]'}</p>
<p><strong>Date of Birth:</strong> [Patient DOB]</p>

<h3>TREATMENT DESCRIPTION</h3>
<p>I hereby authorize ${JSON.parse(localStorage.getItem('doctorProfile'))?.name || '[Physician Name]'} to provide the following treatment:</p>
<p>[Detailed description of the treatment plan]</p>

<h3>RISKS AND BENEFITS</h3>
<p>I understand the potential risks and benefits of this treatment have been explained to me.</p>

<h3>PATIENT CONSENT</h3>
<p>I voluntarily consent to the treatment described above.</p>

<p><strong>Patient Signature:</strong> ___________________________ <strong>Date:</strong> ___________</p>
<p><strong>Physician Signature:</strong> ___________________________ <strong>Date:</strong> ___________</p>
`
  },
  
  anesthesia: {
    title: 'ANESTHESIA CONSENT FORM',
    content: `
<h3>ANESTHESIA INFORMATION</h3>
<p><strong>Type of Anesthesia:</strong> [Local/Sedation/General]</p>
<p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
<p><strong>Anesthesiologist:</strong> [Anesthesiologist Name]</p>

<h3>PATIENT INFORMATION</h3>
<p><strong>Patient Name:</strong> ${document.getElementById('patientName').value || '[Patient Name]'}</p>

<h3>ANESTHESIA DESCRIPTION</h3>
<p>I consent to the administration of anesthesia for my procedure.</p>

<h3>RISKS</h3>
<p>I understand anesthesia carries risks including allergic reactions, breathing difficulties, and other complications.</p>

<p><strong>Patient Signature:</strong> ___________________________ <strong>Date:</strong> ___________</p>
<p><strong>Anesthesiologist Signature:</strong> ___________________________ <strong>Date:</strong> ___________</p>
`
  },
  
  blood_transfusion: {
    title: 'BLOOD TRANSFUSION CONSENT FORM',
    content: `
<h3>BLOOD TRANSFUSION INFORMATION</h3>
<p><strong>Type of Blood Product:</strong> [Blood Type/Components]</p>
<p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>

<h3>PATIENT INFORMATION</h3>
<p><strong>Patient Name:</strong> ${document.getElementById('patientName').value || '[Patient Name]'}</p>

<h3>TRANSFUSION DESCRIPTION</h3>
<p>I consent to receive blood transfusion as deemed necessary by my physician.</p>

<h3>RISKS</h3>
<p>I understand the risks of blood transfusion including infection, allergic reactions, and other complications.</p>

<p><strong>Patient Signature:</strong> ___________________________ <strong>Date:</strong> ___________</p>
<p><strong>Physician Signature:</strong> ___________________________ <strong>Date:</strong> ___________</p>
`
  },
  
  imaging: {
    title: 'IMAGING CONSENT FORM',
    content: `
<h3>IMAGING PROCEDURE</h3>
<p><strong>Procedure:</strong> [CT/MRI/X-ray/etc.]</p>
<p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>

<h3>PATIENT INFORMATION</h3>
<p><strong>Patient Name:</strong> ${document.getElementById('patientName').value || '[Patient Name]'}</p>

<h3>PROCEDURE DESCRIPTION</h3>
<p>I consent to undergo the imaging procedure described above.</p>

<h3>RADIATION EXPOSURE</h3>
<p>I understand this procedure involves radiation exposure and the associated risks.</p>

<p><strong>Patient Signature:</strong> ___________________________ <strong>Date:</strong> ___________</p>
<p><strong>Radiologist Signature:</strong> ___________________________ <strong>Date:</strong> ___________</p>
`
  },
  
  research: {
    title: 'RESEARCH PARTICIPATION CONSENT FORM',
    content: `
<h3>RESEARCH STUDY INFORMATION</h3>
<p><strong>Study Title:</strong> [Study Name]</p>
<p><strong>Principal Investigator:</strong> [Investigator Name]</p>
<p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>

<h3>PARTICIPANT INFORMATION</h3>
<p><strong>Participant Name:</strong> ${document.getElementById('patientName').value || '[Participant Name]'}</p>

<h3>STUDY DESCRIPTION</h3>
<p>I voluntarily agree to participate in this research study.</p>

<h3>RISKS AND BENEFITS</h3>
<p>I understand the potential risks and benefits of participation have been explained to me.</p>

<h3>WITHDRAWAL</h3>
<p>I understand I may withdraw from the study at any time.</p>

<p><strong>Participant Signature:</strong> ___________________________ <strong>Date:</strong> ___________</p>
<p><strong>Witness Signature:</strong> ___________________________ <strong>Date:</strong> ___________</p>
<p><strong>Investigator Signature:</strong> ___________________________ <strong>Date:</strong> ___________</p>
`
  }
};

const consentModal = document.getElementById('consentModal');
const consentTitle = document.getElementById('consentTitle');
const consentContent = document.getElementById('consentContent');

document.getElementById('generateConsentBtn').addEventListener('click', () => {
  const selectedForm = document.getElementById('consentFormSelect').value;
  if (!selectedForm || !consentTemplates[selectedForm]) {
    alert('Please select a consent form type.');
    return;
  }
  
  const template = consentTemplates[selectedForm];
  consentTitle.textContent = template.title;
  consentContent.innerHTML = template.content;
  consentModal.classList.remove('hidden');
});

document.getElementById('printConsentBtn').addEventListener('click', () => {
  const printWindow = window.open('', '', 'height=600,width=800');
  printWindow.document.write(`
    <html>
    <head><title>${consentTitle.textContent}</title><style>body{font-family:Arial,sans-serif;margin:40px;}</style></head>
    <body>${consentContent.innerHTML}</body>
    </html>
  `);
  printWindow.document.close();
  printWindow.print();
});

document.getElementById('closeConsentBtn').addEventListener('click', () => {
  consentModal.classList.add('hidden');
});

document.getElementById('closeConsentModal').addEventListener('click', () => {
  consentModal.classList.add('hidden');
});

consentModal.addEventListener('click', (e) => {
  if (e.target === consentModal) consentModal.classList.add('hidden');
});

// ========== APPOINTMENT BOOKING ==========
const appointmentModal = document.getElementById('appointmentModal');
const appointmentList = document.getElementById('appointmentList');
let appointments = JSON.parse(localStorage.getItem('appointments')) || [];

function updateAppointmentDisplay() {
  appointmentList.innerHTML = '';
  appointments.slice(0, 5).forEach((appt, index) => {
    const div = document.createElement('div');
    div.className = 'appointment-item';
    div.innerHTML = `
      <div><strong>${appt.patientName}</strong></div>
      <div>${new Date(appt.date).toLocaleString()}</div>
      <div>${appt.type} - ${appt.duration}min</div>
    `;
    appointmentList.appendChild(div);
  });
}

document.getElementById('scheduleAppointmentBtn').addEventListener('click', () => {
  const patientName = document.getElementById('patientName').value;
  if (!patientName) {
    alert('Please enter patient name first.');
    return;
  }
  appointmentModal.classList.remove('hidden');
});

document.getElementById('saveAppointmentBtn').addEventListener('click', () => {
  const date = document.getElementById('appointmentDate').value;
  const duration = document.getElementById('appointmentDuration').value;
  const notes = document.getElementById('appointmentNotes').value;
  const patientName = document.getElementById('patientName').value;
  const type = document.getElementById('appointmentType').value;
  
  if (!date) {
    alert('Please select appointment date and time.');
    return;
  }
  
  appointments.push({
    id: Date.now(),
    patientName,
    date,
    duration: parseInt(duration),
    notes,
    type,
    created: new Date().toISOString()
  });
  
  localStorage.setItem('appointments', JSON.stringify(appointments));
  updateAppointmentDisplay();
  appointmentModal.classList.add('hidden');
  
  // Clear form
  document.getElementById('appointmentDate').value = '';
  document.getElementById('appointmentNotes').value = '';
  
  alert('Appointment scheduled successfully!');
});

document.getElementById('cancelAppointmentBtn').addEventListener('click', () => {
  appointmentModal.classList.add('hidden');
});

document.getElementById('closeAppointmentModal').addEventListener('click', () => {
  appointmentModal.classList.add('hidden');
});

appointmentModal.addEventListener('click', (e) => {
  if (e.target === appointmentModal) appointmentModal.classList.add('hidden');
});

// ========== MEDICAL TERMS TRANSLATION ==========
const medicalTerms = {
  en: {
    hypertension: 'High blood pressure',
    diabetes: 'Diabetes mellitus',
    myocardial_infarction: 'Heart attack',
    cerebrovascular_accident: 'Stroke',
    pneumonia: 'Lung infection',
    appendicitis: 'Appendix inflammation',
    cholecystitis: 'Gallbladder inflammation',
    gastroenteritis: 'Stomach and intestinal infection',
    dermatitis: 'Skin inflammation',
    arthritis: 'Joint inflammation'
  },
  hi: {
    hypertension: 'उच्च रक्तचाप',
    diabetes: 'मधुमेह',
    myocardial_infarction: 'दिल का दौरा',
    cerebrovascular_accident: 'स्ट्रोक',
    pneumonia: 'फेफड़ों का संक्रमण',
    appendicitis: 'अपेंडिक्स की सूजन',
    cholecystitis: 'पित्ताशय की सूजन',
    gastroenteritis: 'पेट और आंतों का संक्रमण',
    dermatitis: 'त्वचा की सूजन',
    arthritis: 'जोड़ों की सूजन'
  },
  ta: {
    hypertension: 'உயர் இரத்த அழுத்தம்',
    diabetes: 'நீரிழிவு',
    myocardial_infarction: 'இதயத் தாக்கம்',
    cerebrovascular_accident: 'பக்கவாதம்',
    pneumonia: 'நுரையீரல் தொற்று',
    appendicitis: 'அப்பெண்டிக்ஸ் அழற்சி',
    cholecystitis: 'பித்தப்பை அழற்சி',
    gastroenteritis: 'வயிறு மற்றும் குடல் தொற்று',
    dermatitis: 'தோல் அழற்சி',
    arthritis: 'மூட்டு அழற்சி'
  },
  te: {
    hypertension: 'అధిక రక్తపోటు',
    diabetes: 'మధుమేహం',
    myocardial_infarction: 'గుండెపోటు',
    cerebrovascular_accident: 'స్ట్రోక్',
    pneumonia: 'ఊపిరితిత్తుల ఇన్ఫెక్షన్',
    appendicitis: 'అపెండిక్స్ వాపు',
    cholecystitis: 'పిత్తాశయ వాపు',
    gastroenteritis: 'కడుపు మరియు పేగుల ఇన్ఫెక్షన్',
    dermatitis: 'చర్మ వాపు',
    arthritis: 'కీళ్ల వాపు'
  },
  ml: {
    hypertension: 'ഉയർന്ന രക്തസമ്മർദ്ദം',
    diabetes: 'പ്രമേഹം',
    myocardial_infarction: 'ഹൃദയാഘാതം',
    cerebrovascular_accident: 'സ്ട്രോക്ക്',
    pneumonia: 'ശ്വാസകോശ അണുബാധ',
    appendicitis: 'അപ്പെൻഡിക്സ് വീക്കം',
    cholecystitis: 'പിത്താശയ വീക്കം',
    gastroenteritis: 'വയറും കുടലും ബാധിക്കുന്ന അണുബാധ',
    dermatitis: 'ത്വക്ക് വീക്കം',
    arthritis: 'സന്ധി വീക്കം'
  },
  kn: {
    hypertension: 'ಅಧಿಕ ರಕ್ತದೊತ್ತಡ',
    diabetes: 'ಮಧುಮೇಹ',
    myocardial_infarction: 'ಹೃದಯಾಘಾತ',
    cerebrovascular_accident: 'ಸ್ಟ್ರೋಕ್',
    pneumonia: 'ಶ್ವಾಸಕೋಶದ ಸೋಂಕು',
    appendicitis: 'ಅಪೆಂಡಿಕ್ಸ್ ಉರಿಯೂತ',
    cholecystitis: 'ಪಿತ್ತಕೋಶದ ಉರಿಯೂತ',
    gastroenteritis: 'ಹೊಟ್ಟೆ ಮತ್ತು ಕರುಳಿನ ಸೋಂಕು',
    dermatitis: 'ಚರ್ಮದ ಉರಿಯೂತ',
    arthritis: 'ಸಂಧಿ ಉರಿಯೂತ'
  },
  bn: {
    hypertension: 'উচ্চ রক্তচাপ',
    diabetes: 'ডায়াবেটিস',
    myocardial_infarction: 'হার্ট অ্যাটাক',
    cerebrovascular_accident: 'স্ট্রোক',
    pneumonia: 'ফুসফুসের সংক্রমণ',
    appendicitis: 'অ্যাপেন্ডিক্সের প্রদাহ',
    cholecystitis: 'পিত্তথলির প্রদাহ',
    gastroenteritis: 'পাকস্থলী ও অন্ত্রের সংক্রমণ',
    dermatitis: 'ত্বকের প্রদাহ',
    arthritis: 'জয়েন্টের প্রদাহ'
  },
  mr: {
    hypertension: 'उच्च रक्तदाब',
    diabetes: 'मधुमेह',
    myocardial_infarction: 'हृदयविकाराचा झटका',
    cerebrovascular_accident: 'स्ट्रोक',
    pneumonia: 'फुफ्फुसांचा संसर्ग',
    appendicitis: 'अपेंडिक्सची सूज',
    cholecystitis: 'पित्ताशयाची सूज',
    gastroenteritis: 'पोट आणि आतड्यांचा संसर्ग',
    dermatitis: 'त्वचेची सूज',
    arthritis: 'सांध्यांची सूज'
  },
  gu: {
    hypertension: 'ઉચ્ચ રક્તચાપ',
    diabetes: 'મધુમેહ',
    myocardial_infarction: 'હાર્ટ એટેક',
    cerebrovascular_accident: 'સ્ટ્રોક',
    pneumonia: 'ફેફસાનો ચેપ',
    appendicitis: 'એપેન્ડિક્સની સોજો',
    cholecystitis: 'પિત્તાશયની સોજો',
    gastroenteritis: 'પેટ અને આંતરડાનો ચેપ',
    dermatitis: 'ચામડીની સોજો',
    arthritis: 'સાંધાની સોજો'
  },
  pa: {
    hypertension: 'ਉੱਚ ਰਕਤ ਚਾਪ',
    diabetes: 'ਸ਼ੂਗਰ',
    myocardial_infarction: 'ਦਿਲ ਦਾ ਦੌਰਾ',
    cerebrovascular_accident: 'ਸਟ੍ਰੋਕ',
    pneumonia: 'ਫੇਫੜਿਆਂ ਦੀ ਇਨਫੈਕਸ਼ਨ',
    appendicitis: 'ਅਪੈਂਡਿਕਸ ਦੀ ਸੋਜ',
    cholecystitis: 'ਪਿੱਤੇ ਦੀ ਥੈਲੀ ਦੀ ਸੋਜ',
    gastroenteritis: 'ਪੇਟ ਅਤੇ ਆੰਤਾਂ ਦੀ ਇਨਫੈਕਸ਼ਨ',
    dermatitis: 'ਚਮੜੀ ਦੀ ਸੋਜ',
    arthritis: 'ਜੋੜਾਂ ਦੀ ਸੋਜ'
  }
};

document.getElementById('medicalTermSearch').addEventListener('input', (e) => {
  const query = e.target.value.toLowerCase().trim();
  const language = document.getElementById('medicalTermLanguage').value;
  const resultDiv = document.getElementById('medicalTermResult');
  
  if (!query) {
    resultDiv.textContent = '';
    return;
  }
  
  // Find matching terms
  const matches = Object.entries(medicalTerms.en)
    .filter(([key, value]) => 
      key.toLowerCase().includes(query) || 
      value.toLowerCase().includes(query)
    )
    .slice(0, 3); // Limit to 3 results
  
  if (matches.length === 0) {
    resultDiv.textContent = 'No matching terms found.';
    return;
  }
  
  resultDiv.innerHTML = matches.map(([key, english]) => {
    const translation = medicalTerms[language]?.[key] || english;
    return `<div><strong>${english}</strong> → ${translation}</div>`;
  }).join('');
});

// ========== ENHANCED LETTER GENERATION ==========
function generateLetter() {
  const profile = JSON.parse(localStorage.getItem('doctorProfile')) || {};
  const signature = localStorage.getItem('signature') || '';
  
  const patientName = document.getElementById('patientName').value.trim();
  const patientId = document.getElementById('patientId').value.trim();
  const patientAge = document.getElementById('patientAge').value.trim();
  const patientDob = document.getElementById('patientDob').value;
  const patientSex = document.getElementById('patientSex').value;
  const patientPhone = document.getElementById('patientPhone').value.trim();
  const patientEmail = document.getElementById('patientEmail').value.trim();
  const patientDetailDateValue = document.getElementById('patientDetailDate').value;
  const patientDetailTimeValue = document.getElementById('patientDetailTime').value;
  
  const receivingDocName = document.getElementById('receivingDocName').value.trim();
  const specialty = document.getElementById('specialty').value;
  const hospital = document.getElementById('hospital').value.trim();
  const receivingDocPhone = document.getElementById('receivingDocPhone').value.trim();
  const receivingDocEmail = document.getElementById('receivingDocEmail').value.trim();
  const urgency = document.getElementById('urgency').value;
  const medicalHistory = document.getElementById('medicalHistory').value.trim();
  const medications = document.getElementById('medications').value.trim();
  const allergies = document.getElementById('allergies').value.trim();
  const investigations = document.getElementById('investigations').value.trim();
  const physicalExam = document.getElementById('physicalExam').value.trim();
  const diagnosis = document.getElementById('diagnosis').value.trim();
  const message = document.getElementById('message').value.trim();
  
  // Follow-up information
  const followUpDate = document.getElementById('followUpDate').value;
  const followUpReason = document.getElementById('followUpReason').value.trim();
  const appointmentType = document.getElementById('appointmentType').value;
  const referralDate = patientDetailDateValue ? new Date(`${patientDetailDateValue}T00:00`).toLocaleDateString() : new Date().toLocaleDateString();
  const referralTime = patientDetailTimeValue || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const patientDobLabel = patientDob ? new Date(`${patientDob}T00:00`).toLocaleDateString() : 'N/A';
  const reference = `REF-${new Date().getTime()}`;

  let output = `MEDICAL REFERRAL LETTER

Date of referral: ${referralDate}
Time: ${referralTime}
Reference: ${reference}

To:
Dr. ${receivingDocName || 'N/A'}
${specialty || 'Specialist'}
${hospital || 'N/A'}

Dear Dr. ${receivingDocName || 'Colleague'},

I am referring ${patientName || 'this patient'} for specialist assessment and further management.

Patient details:
Name: ${patientName || 'N/A'}
Patient ID / MR No.: ${patientId || 'N/A'}
Age/Sex: ${patientAge || 'N/A'} years / ${patientSex || 'N/A'}
Date of birth: ${patientDobLabel}
Phone: ${patientPhone || 'N/A'}
Email: ${patientEmail || 'N/A'}

Referral priority: ${urgency}
Requested specialty: ${specialty || 'N/A'}
Receiving doctor phone: ${receivingDocPhone || 'N/A'}
Receiving doctor email: ${receivingDocEmail || 'N/A'}

Clinical summary:
Current symptoms: ${medicalHistory || 'N/A'}
Physical examination: ${physicalExam || 'N/A'}
Results: ${investigations || 'N/A'}
Report / impression: ${diagnosis || 'N/A'}
Current medicines: ${medications || 'N/A'}
Allergies: ${allergies || 'N/A'}

Reason for referral:
${message || 'N/A'}`;
  
  // Add follow-up information
  if (followUpDate || followUpReason) {
    output += `\n\nFollow-up information:\n`;
    if (followUpDate) output += `Suggested follow-up date: ${new Date(followUpDate).toLocaleDateString()}\n`;
    if (followUpReason) output += `Follow-up reason: ${followUpReason}\n`;
    if (appointmentType) output += `Appointment type: ${appointmentType}\n`;
  }
  
  output += `\n\nPlease assess the patient and advise on further investigation and management. Kindly share your findings and recommendations after review.

Sincerely,
Dr. ${profile.name || 'N/A'}
License: ${profile.license || 'N/A'}
Institution: ${profile.hospital || 'N/A'}`;

  if (signature) output += `\n\nDigital signature attached.`;
  
  output += `\n\nAttachments: ${attachments.length} file(s)`;

  document.getElementById('output').textContent = output;
  
  document.getElementById('editLetterBtn').disabled = false;
  document.getElementById('improveLetterBtn').disabled = false;
  document.getElementById('translateLetterBtn').disabled = false;
  document.getElementById('signLetterBtn').disabled = false;
  document.getElementById('saveLetterBtn').disabled = false;
  document.getElementById('exportPdfBtn').disabled = false;
  document.getElementById('exportWordBtn').disabled = false;
  document.getElementById('copyEmailBtn').disabled = false;
  document.getElementById('openEmailBtn').disabled = false;
  document.getElementById('printBtn').disabled = false;
  document.getElementById('saveHistoryBtn').disabled = false;
  document.getElementById('copyLetterBtn').disabled = false;
  
  saveState();
  addAuditLog(`Referral letter generated for ${patientName}`);
  autoSave();
}


document.getElementById('generateBtn').addEventListener('click', generateLetter);

function getSafeFilenamePart(value, fallback) {
  return (value || fallback).trim().replace(/[^a-z0-9_-]+/gi, '_').replace(/^_+|_+$/g, '') || fallback;
}

function getGeneratedLetterText() {
  const letter = document.getElementById('output').textContent;
  if (!letter || letter.includes('will appear here')) {
    alert('Please generate a referral letter first.');
    return '';
  }
  return letter;
}

function saveReferralLetterFile() {
  const letter = getGeneratedLetterText();
  if (!letter) return;

  const patientName = getSafeFilenamePart(document.getElementById('patientName').value, 'patient');
  const referralDate = document.getElementById('patientDetailDate').value || getLocalDateValue(new Date());
  const blob = new Blob([letter], { type: 'text/plain;charset=utf-8' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `referral_letter_${patientName}_${referralDate}.txt`;
  link.click();
  URL.revokeObjectURL(link.href);
  addAuditLog(`Referral letter saved as file for ${patientName}`);
}

document.getElementById('saveLetterBtn').addEventListener('click', saveReferralLetterFile);

async function improveLetterWithGemini() {
  const letter = getGeneratedLetterText();
  if (!letter) return;

  const apiKey = llmApiKeyInput?.value.trim() || localStorage.getItem(GEMINI_API_KEY_STORAGE) || '';
  if (!apiKey) {
    alert('Please enter your Gemini API key first.');
    llmApiKeyInput?.focus();
    return;
  }

  const improveLetterBtn = document.getElementById('improveLetterBtn');
  const originalLabel = improveLetterBtn.textContent;
  improveLetterBtn.disabled = true;
  improveLetterBtn.textContent = 'Improving...';
  recordingStatus.textContent = 'Gemini AI is improving the referral letter...';

  try {
    localStorage.setItem(GEMINI_API_KEY_STORAGE, apiKey);
    localStorage.removeItem(LEGACY_LLM_API_KEY_STORAGE);

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey
      },
      body: JSON.stringify({
        contents: [{
          role: 'user',
          parts: [{
            text: `Improve this medical referral letter into a clear, professional, print-ready referral.
Keep all clinical facts exactly as provided. Do not invent diagnosis, examination findings, medicines, dates, doctor details, or patient details.
Preserve important headings and contact details. Return only the improved referral letter text.

Referral letter:
${letter}`
          }]
        }],
        generationConfig: {
          temperature: 0.2
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Gemini request failed (${response.status})`);
    }

    const data = await response.json();
    const improvedLetter = getResponseText(data);
    if (!improvedLetter) {
      throw new Error('Gemini did not return an improved letter.');
    }

    document.getElementById('output').textContent = improvedLetter;
    saveState();
    autoSave();
    addAuditLog('Referral letter improved with Gemini AI');
    recordingStatus.textContent = 'Referral letter improved with Gemini AI.';
  } catch (error) {
    console.error(error);
    alert(error.message || 'Gemini AI could not improve the letter.');
    recordingStatus.textContent = 'Gemini AI could not improve the letter. Check the API key or network.';
  } finally {
    improveLetterBtn.disabled = false;
    improveLetterBtn.textContent = originalLabel;
  }
}

document.getElementById('improveLetterBtn').addEventListener('click', improveLetterWithGemini);

async function translateLetterWithGemini() {
  const letter = getGeneratedLetterText();
  if (!letter) return;

  const targetLanguage = languageNames[currentLanguage] || 'English';
  if (currentLanguage === 'en') {
    alert('Please choose a non-English language from the top language selector first.');
    document.getElementById('languageSelect')?.focus();
    return;
  }

  const apiKey = llmApiKeyInput?.value.trim() || localStorage.getItem(GEMINI_API_KEY_STORAGE) || '';
  if (!apiKey) {
    alert('Please enter your Gemini API key first.');
    llmApiKeyInput?.focus();
    return;
  }

  const translateLetterBtn = document.getElementById('translateLetterBtn');
  const originalLabel = translateLetterBtn.textContent;
  translateLetterBtn.disabled = true;
  translateLetterBtn.textContent = 'Translating...';
  recordingStatus.textContent = `Gemini AI is translating the referral letter to ${targetLanguage}...`;

  try {
    localStorage.setItem(GEMINI_API_KEY_STORAGE, apiKey);
    localStorage.removeItem(LEGACY_LLM_API_KEY_STORAGE);

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey
      },
      body: JSON.stringify({
        contents: [{
          role: 'user',
          parts: [{
            text: `Translate this medical referral letter into ${targetLanguage}.
Keep patient names, doctor names, hospital names, dates, phone numbers, emails, IDs, medicine names, dosages, lab values, and clinical facts unchanged.
Preserve the same letter structure and headings as much as possible.
Return only the translated referral letter text.

Referral letter:
${letter}`
          }]
        }],
        generationConfig: {
          temperature: 0.1
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Gemini request failed (${response.status})`);
    }

    const data = await response.json();
    const translatedLetter = getResponseText(data);
    if (!translatedLetter) {
      throw new Error('Gemini did not return a translated letter.');
    }

    document.getElementById('output').textContent = translatedLetter;
    saveState();
    autoSave();
    addAuditLog(`Referral letter translated to ${targetLanguage} with Gemini AI`);
    recordingStatus.textContent = `Referral letter translated to ${targetLanguage}.`;
  } catch (error) {
    console.error(error);
    alert(error.message || 'Gemini AI could not translate the letter.');
    recordingStatus.textContent = 'Gemini AI could not translate the letter. Check the API key or network.';
  } finally {
    translateLetterBtn.disabled = false;
    translateLetterBtn.textContent = originalLabel;
  }
}

document.getElementById('translateLetterBtn').addEventListener('click', translateLetterWithGemini);

// ========== EDIT LETTER ==========
const editModal = document.getElementById('editModal');
const editLetterBtn = document.getElementById('editLetterBtn');
const editLetterText = document.getElementById('editLetterText');

editLetterBtn.addEventListener('click', () => {
  editLetterText.value = document.getElementById('output').textContent;
  editModal.classList.remove('hidden');
});

document.getElementById('saveEditBtn').addEventListener('click', () => {
  document.getElementById('output').textContent = editLetterText.value;
  editModal.classList.add('hidden');
  addAuditLog('Letter edited manually');
  saveState();
  autoSave();
});

document.getElementById('cancelEditBtn').addEventListener('click', () => {
  editModal.classList.add('hidden');
});

document.getElementById('closeEditModal').addEventListener('click', () => {
  editModal.classList.add('hidden');
});

editModal.addEventListener('click', (e) => {
  if (e.target === editModal) editModal.classList.add('hidden');
});

// ========== AUTO-SAVE DRAFT ==========
let autoSaveStatusTimer;

function autoSave() {
  const statusText = document.getElementById('autoSaveStatusText');
  if (statusText) statusText.textContent = 'Saving...';

  const draft = {
    patientName: document.getElementById('patientName').value,
    patientId: document.getElementById('patientId').value,
    patientAge: document.getElementById('patientAge').value,
    patientDob: document.getElementById('patientDob').value,
    patientSex: document.getElementById('patientSex').value,
    patientPhone: document.getElementById('patientPhone').value,
    patientEmail: document.getElementById('patientEmail').value,
    patientDetailDate: document.getElementById('patientDetailDate').value,
    patientDetailTime: document.getElementById('patientDetailTime').value,
    receivingDocName: document.getElementById('receivingDocName').value,
    receivingDocPhone: document.getElementById('receivingDocPhone').value,
    receivingDocEmail: document.getElementById('receivingDocEmail').value,
    specialty: document.getElementById('specialty').value,
    hospital: document.getElementById('hospital').value,
    urgency: document.getElementById('urgency').value,
    referralStatus: document.getElementById('referralStatus').value,
    medicalHistory: document.getElementById('medicalHistory').value,
    medications: document.getElementById('medications').value,
    allergies: document.getElementById('allergies').value,
    investigations: document.getElementById('investigations').value,
    physicalExam: document.getElementById('physicalExam').value,
    diagnosis: document.getElementById('diagnosis').value,
    message: document.getElementById('message').value,
    followUpDate: document.getElementById('followUpDate').value,
    followUpReason: document.getElementById('followUpReason').value,
    appointmentType: document.getElementById('appointmentType').value,
    timestamp: new Date().getTime()
  };
  localStorage.setItem('referral_draft', JSON.stringify(draft));
  
  const indicator = document.getElementById('autoSaveIndicator');
  indicator.classList.add('active');
  clearTimeout(autoSaveStatusTimer);
  autoSaveStatusTimer = setTimeout(() => {
    indicator.classList.remove('active');
    if (statusText) {
      statusText.textContent = `Saved just now ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }
  }, 500);
}

document.querySelectorAll('input, textarea, select').forEach(el => {
  el.addEventListener('change', autoSave);
});

async function fillFormFromOneSentenceWithGemini() {
  const quickFillInput = document.getElementById('quickFillInput');
  const quickFillStatus = document.getElementById('quickFillStatus');
  const quickFillBtn = document.getElementById('quickFillBtn');
  const sentence = quickFillInput?.value.trim() || '';

  if (!sentence) {
    alert('Please enter one sentence first.');
    quickFillInput?.focus();
    return;
  }

  const apiKey = llmApiKeyInput?.value.trim() || localStorage.getItem(GEMINI_API_KEY_STORAGE) || '';
  if (!apiKey) {
    alert('Please enter your Gemini API key first.');
    llmApiKeyInput?.focus();
    return;
  }

  const originalLabel = quickFillBtn.textContent;
  quickFillBtn.disabled = true;
  quickFillBtn.textContent = 'Filling...';
  if (quickFillStatus) quickFillStatus.textContent = 'Gemini is reading the sentence and filling matching fields...';

  try {
    localStorage.setItem(GEMINI_API_KEY_STORAGE, apiKey);
    localStorage.removeItem(LEGACY_LLM_API_KEY_STORAGE);

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey
      },
      body: JSON.stringify({
        contents: [{
          role: 'user',
          parts: [{
            text: `Extract referral form fields from this one sentence.
Return only valid JSON with these keys:
patientName, patientAge, patientSex, patientPhone, patientEmail, receivingDoctorName, hospital, currentSymptoms, physicalExam, result, report, referralReason, medications, allergies, urgency, specialty.

Use only these sex values when clear: Male, Female, Other.
Use only these urgency values when clear: Routine, Urgent, Emergency.
Use only these specialties when clear: Cardiology, Neurology, Orthopaedics, Gastroenterology, General Surgery, Nephrology, Pulmonology, ENT, Oncology.
Do not invent details. Use empty strings for unknown fields.

Sentence:
${sentence}`
          }]
        }],
        generationConfig: {
          temperature: 0.1,
          responseMimeType: 'application/json'
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Gemini request failed (${response.status})`);
    }

    const data = await response.json();
    const fields = readLlmJson(getResponseText(data));
    if (!fields) {
      throw new Error('Gemini did not return readable form fields.');
    }

    applyLlmReferralFields(fields);
    generateLetter();
    if (quickFillStatus) quickFillStatus.textContent = 'Form filled and referral output generated.';
    addAuditLog('Form filled from one sentence with Gemini AI');
  } catch (error) {
    console.error(error);
    if (quickFillStatus) quickFillStatus.textContent = 'Gemini could not fill the form. Check API key or network.';
    alert(error.message || 'Gemini could not fill the form.');
  } finally {
    quickFillBtn.disabled = false;
    quickFillBtn.textContent = originalLabel;
  }
}

document.getElementById('quickFillBtn')?.addEventListener('click', fillFormFromOneSentenceWithGemini);

document.getElementById('saveDraftBtn').addEventListener('click', () => {
  autoSave();
  alert('Draft saved!');
  addAuditLog('Draft manually saved');
});

document.getElementById('loadDraftBtn').addEventListener('click', () => {
  const draft = localStorage.getItem('referral_draft');
  if (!draft) {
    alert('No saved draft found.');
    return;
  }

  const data = JSON.parse(draft);
  document.getElementById('patientName').value = data.patientName || '';
  document.getElementById('patientId').value = data.patientId || '';
  document.getElementById('patientAge').value = data.patientAge || '';
  document.getElementById('patientDob').value = data.patientDob || '';
  document.getElementById('patientSex').value = data.patientSex || '';
  document.getElementById('patientPhone').value = data.patientPhone || '';
  document.getElementById('patientEmail').value = data.patientEmail || '';
  document.getElementById('patientDetailDate').value = data.patientDetailDate || getLocalDateValue(new Date());
  document.getElementById('patientDetailTime').value = data.patientDetailTime || getLocalTimeValue(new Date());
  document.getElementById('receivingDocName').value = data.receivingDocName || '';
  document.getElementById('receivingDocPhone').value = data.receivingDocPhone || '';
  document.getElementById('receivingDocEmail').value = data.receivingDocEmail || '';
  document.getElementById('specialty').value = data.specialty || '';
  document.getElementById('hospital').value = data.hospital || '';
  document.getElementById('urgency').value = data.urgency || '';
  document.getElementById('referralStatus').value = data.referralStatus || 'Draft';
  document.getElementById('medicalHistory').value = data.medicalHistory || '';
  document.getElementById('medications').value = data.medications || '';
  document.getElementById('allergies').value = data.allergies || '';
  document.getElementById('investigations').value = data.investigations || '';
  document.getElementById('physicalExam').value = data.physicalExam || '';
  document.getElementById('diagnosis').value = data.diagnosis || '';
  document.getElementById('message').value = data.message || '';
  document.getElementById('followUpDate').value = data.followUpDate || '';
  document.getElementById('followUpReason').value = data.followUpReason || '';
  document.getElementById('appointmentType').value = data.appointmentType || '';
  if (data.patientDob && !data.patientAge) updateAgeFromDob();
  
  alert('Draft loaded!');
  addAuditLog('Draft loaded');
});

// ========== EXPORT PDF ==========
function escapeHtml(value) {
  return String(value || '').replace(/[&<>"']/g, char => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[char]));
}

function getPdfLetterElement(letter) {
  const profile = JSON.parse(localStorage.getItem('doctorProfile')) || {};
  const signature = localStorage.getItem('signature') || '';
  const patientName = document.getElementById('patientName').value.trim() || 'N/A';
  const patientId = document.getElementById('patientId').value.trim() || 'N/A';
  const specialty = document.getElementById('specialty').value || 'Specialist';
  const urgency = document.getElementById('urgency').value || 'Routine';
  const referralDate = document.getElementById('patientDetailDate').value || getLocalDateValue(new Date());
  const letterHtml = escapeHtml(letter).replace(/\n/g, '<br>');
  const element = document.createElement('div');
  element.className = 'pdf-letter';
  element.innerHTML = `
    <style>
      .pdf-letter {
        width: 190mm;
        min-height: 277mm;
        padding: 18mm;
        color: #143141;
        background: #ffffff;
        font-family: Arial, sans-serif;
        font-size: 11pt;
        line-height: 1.55;
      }
      .pdf-letter-header {
        display: flex;
        justify-content: space-between;
        gap: 20px;
        padding-bottom: 14px;
        border-bottom: 3px solid #0f8f8c;
      }
      .pdf-letter-title {
        margin: 0;
        color: #0b6f73;
        font-size: 22pt;
        letter-spacing: 0;
      }
      .pdf-letter-subtitle {
        margin: 4px 0 0;
        color: #547083;
        font-size: 10pt;
      }
      .pdf-doctor {
        text-align: right;
        color: #143141;
        font-size: 10pt;
      }
      .pdf-meta {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 8px;
        margin: 16px 0;
      }
      .pdf-meta div {
        padding: 8px;
        border: 1px solid #d8e4ec;
        border-radius: 6px;
        background: #f4f8fb;
      }
      .pdf-meta span {
        display: block;
        color: #547083;
        font-size: 8.5pt;
        font-weight: 700;
      }
      .pdf-meta strong {
        display: block;
        color: #143141;
        font-size: 10pt;
      }
      .pdf-body {
        padding: 14px 0 18px;
        white-space: normal;
      }
      .pdf-signature {
        display: flex;
        justify-content: flex-end;
        margin-top: 18px;
      }
      .pdf-signature img {
        max-width: 140px;
        max-height: 70px;
      }
      .pdf-footer {
        margin-top: 18px;
        padding-top: 10px;
        border-top: 1px solid #d8e4ec;
        color: #547083;
        font-size: 8.5pt;
        text-align: center;
      }
    </style>
    <div class="pdf-letter-header">
      <div>
        <h1 class="pdf-letter-title">${escapeHtml(profile.hospital || 'Medical Referral Letter')}</h1>
        <p class="pdf-letter-subtitle">Professional referral document</p>
      </div>
      <div class="pdf-doctor">
        <strong>Dr. ${escapeHtml(profile.name || 'N/A')}</strong><br>
        License: ${escapeHtml(profile.license || 'N/A')}<br>
        ${escapeHtml(profile.hospital || '')}
      </div>
    </div>
    <div class="pdf-meta">
      <div><span>Patient</span><strong>${escapeHtml(patientName)}</strong></div>
      <div><span>Patient ID</span><strong>${escapeHtml(patientId)}</strong></div>
      <div><span>Specialty</span><strong>${escapeHtml(specialty)}</strong></div>
      <div><span>Priority</span><strong>${escapeHtml(urgency)}</strong></div>
    </div>
    <div class="pdf-body">${letterHtml}</div>
    ${signature ? `<div class="pdf-signature"><img src="${signature}" alt="Digital signature"></div>` : ''}
    <div class="pdf-footer">Generated on ${new Date(`${referralDate}T00:00`).toLocaleDateString()} · Clinical Referral Letter Builder</div>
  `;
  return element;
}

document.getElementById('exportPdfBtn').addEventListener('click', () => {
  const letter = getGeneratedLetterText();
  if (!letter) return;

  const patientName = getSafeFilenamePart(document.getElementById('patientName').value, 'patient');
  const element = getPdfLetterElement(letter);
  const opt = {
    margin: 0,
    filename: `referral_letter_${patientName}_${Date.now()}.pdf`,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2 },
    jsPDF: { orientation: 'portrait', unit: 'mm', format: 'a4' }
  };
  html2pdf().set(opt).from(element).save();
  addAuditLog('Letter exported as styled PDF');
});

// ========== PRINT ==========
document.getElementById('printBtn').addEventListener('click', () => {
  const printWindow = window.open('', '', 'height=600,width=800');
  printWindow.document.write(`<pre>${document.getElementById('output').textContent}</pre>`);
  printWindow.document.close();
  printWindow.print();
  addAuditLog('Letter printed');
});

// ========== WORD EXPORT & EMAIL ==========
function getEmailDraft() {
  const patientName = document.getElementById('patientName').value.trim() || 'patient';
  const specialty = document.getElementById('specialty').value || 'Specialist';
  const letter = document.getElementById('output').textContent;
  return {
    to: document.getElementById('receivingDocEmail').value.trim(),
    subject: `Referral letter - ${patientName} - ${specialty}`,
    body: `Dear Colleague,\n\nPlease find the referral details below.\n\n${letter}\n\nKind regards`
  };
}

document.getElementById('exportWordBtn').addEventListener('click', () => {
  const letter = document.getElementById('output').textContent;
  const html = `<html><head><meta charset="utf-8"></head><body><pre>${letter.replace(/[&<>]/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[char]))}</pre></body></html>`;
  const blob = new Blob([html], { type: 'application/msword' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `referral_${Date.now()}.doc`;
  link.click();
  URL.revokeObjectURL(link.href);
  addAuditLog('Letter exported as Word document');
});

document.getElementById('copyEmailBtn').addEventListener('click', () => {
  const email = getEmailDraft();
  navigator.clipboard.writeText(`Subject: ${email.subject}\n\n${email.body}`).then(() => {
    alert('Email draft copied!');
  }).catch(() => alert('Unable to copy email draft.'));
});

document.getElementById('openEmailBtn').addEventListener('click', () => {
  const email = getEmailDraft();
  window.location.href = `mailto:${encodeURIComponent(email.to)}?subject=${encodeURIComponent(email.subject)}&body=${encodeURIComponent(email.body)}`;
});

// ========== PRIVACY, SPECIALISTS, QUICK TEMPLATES ==========
function updateFollowUpReminders() {
  const list = document.getElementById('followUpReminderList');
  const summary = document.getElementById('followUpSummary');
  if (!list) return;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const reminders = getReferralHistory()
    .filter(item => item.formData?.followUpDate)
    .map(item => {
      const dueDate = new Date(`${item.formData.followUpDate}T00:00`);
      const dayDifference = Math.round((dueDate - today) / 86400000);
      let status = 'upcoming';
      if (dayDifference < 0) status = 'overdue';
      if (dayDifference === 0) status = 'today';
      return { ...item, dueDate, dayDifference, status };
    })
    .sort((a, b) => a.dueDate - b.dueDate);

  if (summary) {
    const overdue = reminders.filter(item => item.status === 'overdue').length;
    const todayCount = reminders.filter(item => item.status === 'today').length;
    const upcoming = reminders.filter(item => item.status === 'upcoming').length;
    summary.innerHTML = `
      <div><strong>${overdue}</strong><span>Overdue</span></div>
      <div><strong>${todayCount}</strong><span>Today</span></div>
      <div><strong>${upcoming}</strong><span>Upcoming</span></div>
    `;
  }

  const visibleReminders = reminders.slice(0, 6);
  list.innerHTML = reminders.length
    ? visibleReminders.map(item => {
      const statusLabel = item.status === 'overdue'
        ? `${Math.abs(item.dayDifference)} day(s) overdue`
        : item.status === 'today'
          ? 'Due today'
          : `Due in ${item.dayDifference} day(s)`;
      return `
        <button class="followup-item ${item.status}" type="button" data-followup-open="${item.id}">
          <span>
            <strong>${item.patientName}</strong>
            <small>${item.specialty || 'No specialty'} · ${item.formData?.followUpReason || 'Follow-up'}</small>
          </span>
          <em>${statusLabel}</em>
        </button>
      `;
    }).join('')
    : '<div class="empty-note">No saved follow-ups yet.</div>';
}

function getReferralHistory() {
  return JSON.parse(localStorage.getItem('referral_history')) || [];
}

function saveReferralHistory(history) {
  localStorage.setItem('referral_history', JSON.stringify(history));
}

document.getElementById('followUpReminderList')?.addEventListener('click', (event) => {
  const button = event.target.closest('[data-followup-open]');
  if (!button) return;
  const item = getReferralHistory().find(referral => String(referral.id) === button.dataset.followupOpen);
  if (item) loadFromHistory(item);
});

function getTrackerFilters() {
  return {
    search: (document.getElementById('trackerSearch')?.value || '').trim().toLowerCase(),
    status: document.getElementById('trackerStatusFilter')?.value || '',
    urgency: document.getElementById('trackerUrgencyFilter')?.value || '',
    specialty: document.getElementById('trackerSpecialtyFilter')?.value || ''
  };
}

function getTrackerMatches() {
  const filters = getTrackerFilters();
  return getReferralHistory().filter(item => {
    const form = item.formData || {};
    const searchText = [
      item.patientName,
      item.specialty,
      item.status,
      form.hospital,
      form.receivingDocName,
      form.patientId,
      form.urgency
    ].join(' ').toLowerCase();

    if (filters.search && !searchText.includes(filters.search)) return false;
    if (filters.status && (item.status || 'Draft') !== filters.status) return false;
    if (filters.urgency && (form.urgency || '') !== filters.urgency) return false;
    if (filters.specialty && (item.specialty || '') !== filters.specialty) return false;
    return true;
  });
}

function updateTrackerSpecialties() {
  const select = document.getElementById('trackerSpecialtyFilter');
  if (!select) return;
  const current = select.value;
  const specialties = [...new Set(getReferralHistory().map(item => item.specialty).filter(Boolean))].sort();
  select.innerHTML = '<option value="">All specialties</option>';
  specialties.forEach(specialty => {
    const option = document.createElement('option');
    option.value = specialty;
    option.textContent = specialty;
    select.appendChild(option);
  });
  select.value = specialties.includes(current) ? current : '';
}

function renderAdvancedTracker() {
  const list = document.getElementById('advancedTrackerList');
  const summary = document.getElementById('trackerSummary');
  if (!list || !summary) return;

  updateTrackerSpecialties();
  const matches = getTrackerMatches().slice().reverse();
  const emergencyCount = matches.filter(item => item.formData?.urgency === 'Emergency').length;
  const pendingCount = matches.filter(item => (item.status || 'Draft') === 'Pending').length;

  summary.innerHTML = `
    <div><span>Matched</span><strong>${matches.length}</strong></div>
    <div><span>Emergency</span><strong>${emergencyCount}</strong></div>
    <div><span>Pending</span><strong>${pendingCount}</strong></div>
  `;

  if (!matches.length) {
    list.innerHTML = '<div class="empty-note">No referrals match these filters.</div>';
    return;
  }

  list.innerHTML = matches.map(item => {
    const form = item.formData || {};
    const urgency = form.urgency || 'Routine';
    const status = item.status || 'Draft';
    const followUp = form.followUpDate ? new Date(form.followUpDate).toLocaleDateString() : 'No follow-up';
    return `
      <article class="tracker-item ${urgency.toLowerCase()}">
        <div class="tracker-item-head">
          <strong>${item.patientName || 'Unnamed patient'}</strong>
          <span>${status}</span>
        </div>
        <p>${item.specialty || 'No specialty'} · ${form.hospital || 'No hospital'}</p>
        <p>${urgency} · ${followUp}</p>
        <select data-tracker-status="${item.id}">
          <option ${status === 'Draft' ? 'selected' : ''}>Draft</option>
          <option ${status === 'Sent' ? 'selected' : ''}>Sent</option>
          <option ${status === 'Pending' ? 'selected' : ''}>Pending</option>
          <option ${status === 'Accepted' ? 'selected' : ''}>Accepted</option>
          <option ${status === 'Completed' ? 'selected' : ''}>Completed</option>
        </select>
        <button class="btn btn-small" type="button" data-tracker-open="${item.id}">Open</button>
      </article>
    `;
  }).join('');
}

function refreshAdvancedViews() {
  updateFollowUpReminders();
  renderAdvancedTracker();
}

document.getElementById('privacyModeBtn').addEventListener('click', () => {
  document.body.classList.toggle('privacy-mode');
  const active = document.body.classList.contains('privacy-mode');
  document.getElementById('privacyModeBtn').textContent = active ? 'Show Patient Details' : 'Hide Patient Details';
});

function getSpecialists() {
  return JSON.parse(localStorage.getItem('specialist_directory')) || [];
}

function saveSpecialists(items) {
  localStorage.setItem('specialist_directory', JSON.stringify(items));
}

function renderSpecialists() {
  const specialists = getSpecialists();
  const select = document.getElementById('specialistSelect');
  const list = document.getElementById('specialistDirectoryList');
  select.innerHTML = '<option value="">Load saved specialist...</option>';
  specialists.forEach(item => {
    const option = document.createElement('option');
    option.value = item.id;
    option.textContent = `${item.name} - ${item.specialty || 'Specialist'}`;
    select.appendChild(option);
  });
  document.getElementById('deleteSpecialistBtn').disabled = !specialists.length;
  list.innerHTML = specialists.length
    ? specialists.map(item => `<div class="specialist-item"><strong>${item.name}</strong><span>${item.specialty || 'No specialty'} | ${item.hospital || 'No hospital'}</span></div>`).join('')
    : '<div class="empty-note">Saved specialists will appear here.</div>';
}

document.getElementById('saveSpecialistBtn').addEventListener('click', () => {
  const name = document.getElementById('receivingDocName').value.trim();
  if (!name) {
    alert('Enter receiving doctor name first.');
    return;
  }
  const specialists = getSpecialists();
  const existing = specialists.find(item => item.name.toLowerCase() === name.toLowerCase());
  const next = {
    id: existing?.id || `sp-${Date.now()}`,
    name,
    specialty: document.getElementById('specialty').value,
    hospital: document.getElementById('hospital').value.trim(),
    phone: document.getElementById('receivingDocPhone').value.trim(),
    email: document.getElementById('receivingDocEmail').value.trim()
  };
  if (existing) Object.assign(existing, next);
  else specialists.push(next);
  saveSpecialists(specialists);
  renderSpecialists();
  alert('Specialist saved.');
});

document.getElementById('specialistSelect').addEventListener('change', (e) => {
  const item = getSpecialists().find(specialist => specialist.id === e.target.value);
  if (!item) return;
  document.getElementById('receivingDocName').value = item.name || '';
  document.getElementById('specialty').value = item.specialty || '';
  document.getElementById('hospital').value = item.hospital || '';
  document.getElementById('receivingDocPhone').value = item.phone || '';
  document.getElementById('receivingDocEmail').value = item.email || '';
  autoSave();
});

document.getElementById('deleteSpecialistBtn').addEventListener('click', () => {
  const selected = document.getElementById('specialistSelect').value;
  if (!selected) return;
  saveSpecialists(getSpecialists().filter(item => item.id !== selected));
  renderSpecialists();
});

const specialtyTemplates = {
  Cardiology: 'Cardiology referral: chest pain/palpitations/breathlessness. Please review ECG, cardiac enzymes, risk factors, current cardiac medicines, and advise further management.',
  Neurology: 'Neurology referral: headache/seizure/weakness/sensory symptoms. Please review neurological examination, imaging, onset timeline, and advise further management.',
  Orthopaedics: 'Orthopedic referral: pain/injury/restricted mobility. Please review X-ray/MRI findings, site of symptoms, functional limitation, and advise treatment plan.',
  'General Surgery': 'Surgical referral: abdominal/procedural complaint. Please review examination findings, imaging/labs, current treatment, and need for surgical intervention.',
  Emergency: 'Emergency referral: acute clinical concern requiring urgent assessment and immediate management advice.'
};

document.querySelectorAll('.specialty-template-btn').forEach(button => {
  button.addEventListener('click', () => {
    const template = specialtyTemplates[button.dataset.template];
    if (!template) return;
    document.getElementById('message').value = template;
    if (button.dataset.template !== 'Emergency') {
      document.getElementById('specialty').value = button.dataset.template;
    } else {
      document.getElementById('urgency').value = 'Emergency';
    }
    autoSave();
  });
});

['trackerSearch', 'trackerStatusFilter', 'trackerUrgencyFilter', 'trackerSpecialtyFilter'].forEach(id => {
  const el = document.getElementById(id);
  if (!el) return;
  el.addEventListener('input', renderAdvancedTracker);
  el.addEventListener('change', renderAdvancedTracker);
});

document.getElementById('advancedTrackerList')?.addEventListener('click', (event) => {
  const openButton = event.target.closest('[data-tracker-open]');
  if (!openButton) return;
  const item = getReferralHistory().find(referral => String(referral.id) === openButton.dataset.trackerOpen);
  if (item) loadFromHistory(item);
});

document.getElementById('advancedTrackerList')?.addEventListener('change', (event) => {
  const statusSelect = event.target.closest('[data-tracker-status]');
  if (!statusSelect) return;
  const history = getReferralHistory();
  const item = history.find(referral => String(referral.id) === statusSelect.dataset.trackerStatus);
  if (!item) return;
  item.status = statusSelect.value;
  saveReferralHistory(history);
  loadHistory();
  refreshAdvancedViews();
});

// ========== SAVE TO HISTORY ==========
function saveToHistory() {
  const patientName = document.getElementById('patientName').value.trim();
  if (!patientName) {
    alert('Please enter patient name.');
    return;
  }

  const letterContent = document.getElementById('output').textContent;
  if (!letterContent || letterContent.includes('will appear here')) {
    alert('Please generate a referral letter first.');
    return;
  }

  let history = JSON.parse(localStorage.getItem('referral_history')) || [];
  
  history.push({
    id: new Date().getTime(),
    patientName: patientName,
    letter: letterContent,
    timestamp: new Date().toLocaleString(),
    status: document.getElementById('referralStatus').value,
    specialty: document.getElementById('specialty').value,
    formData: {
      patientId: document.getElementById('patientId').value,
      patientAge: document.getElementById('patientAge').value,
      patientDob: document.getElementById('patientDob').value,
      patientPhone: document.getElementById('patientPhone').value,
      patientEmail: document.getElementById('patientEmail').value,
      patientDetailDate: document.getElementById('patientDetailDate').value,
      patientDetailTime: document.getElementById('patientDetailTime').value,
      receivingDocName: document.getElementById('receivingDocName').value,
      receivingDocPhone: document.getElementById('receivingDocPhone').value,
      receivingDocEmail: document.getElementById('receivingDocEmail').value,
      hospital: document.getElementById('hospital').value,
      urgency: document.getElementById('urgency').value,
      medicalHistory: document.getElementById('medicalHistory').value,
      medications: document.getElementById('medications').value,
      allergies: document.getElementById('allergies').value,
      investigations: document.getElementById('investigations').value,
      physicalExam: document.getElementById('physicalExam').value,
      diagnosis: document.getElementById('diagnosis').value,
      message: document.getElementById('message').value,
      followUpDate: document.getElementById('followUpDate').value,
      followUpReason: document.getElementById('followUpReason').value,
      appointmentType: document.getElementById('appointmentType').value
    }
  });

  localStorage.setItem('referral_history', JSON.stringify(history));
  alert('Referral saved to history!');
  loadHistory();
  refreshAdvancedViews();
  addAuditLog(`Referral saved: ${patientName}`);
}

document.getElementById('saveHistoryBtn').addEventListener('click', saveToHistory);

// ========== LOAD HISTORY ==========
function loadHistory() {
  const history = JSON.parse(localStorage.getItem('referral_history')) || [];
  const historyList = document.getElementById('historyList');
  historyList.innerHTML = '';

  history.reverse().forEach(item => {
    const div = document.createElement('div');
    div.className = 'history-item';
    div.innerHTML = `<div class="history-item-name">${item.patientName}</div><div class="history-item-date">${item.timestamp}</div>`;
    div.addEventListener('click', () => loadFromHistory(item));
    historyList.appendChild(div);
  });
}

function loadFromHistory(item) {
  document.getElementById('patientName').value = item.patientName;
  document.getElementById('patientId').value = item.formData.patientId || '';
  document.getElementById('patientAge').value = item.formData.patientAge || '';
  document.getElementById('patientDob').value = item.formData.patientDob || '';
  document.getElementById('patientPhone').value = item.formData.patientPhone || '';
  document.getElementById('patientEmail').value = item.formData.patientEmail || '';
  document.getElementById('patientDetailDate').value = item.formData.patientDetailDate || getLocalDateValue(new Date());
  document.getElementById('patientDetailTime').value = item.formData.patientDetailTime || getLocalTimeValue(new Date());
  document.getElementById('receivingDocName').value = item.formData.receivingDocName || '';
  document.getElementById('receivingDocPhone').value = item.formData.receivingDocPhone || '';
  document.getElementById('receivingDocEmail').value = item.formData.receivingDocEmail || '';
  document.getElementById('specialty').value = item.specialty || '';
  document.getElementById('hospital').value = item.formData.hospital || '';
  document.getElementById('urgency').value = item.formData.urgency || '';
  document.getElementById('medicalHistory').value = item.formData.medicalHistory || '';
  document.getElementById('medications').value = item.formData.medications || '';
  document.getElementById('allergies').value = item.formData.allergies || '';
  document.getElementById('investigations').value = item.formData.investigations || '';
  document.getElementById('physicalExam').value = item.formData.physicalExam || '';
  document.getElementById('diagnosis').value = item.formData.diagnosis || '';
  document.getElementById('message').value = item.formData.message || '';
  document.getElementById('followUpDate').value = item.formData.followUpDate || '';
  document.getElementById('followUpReason').value = item.formData.followUpReason || '';
  document.getElementById('appointmentType').value = item.formData.appointmentType || '';
  document.getElementById('output').textContent = item.letter;
  document.getElementById('referralStatus').value = item.status || 'Draft';
  
  document.getElementById('editLetterBtn').disabled = false;
  document.getElementById('improveLetterBtn').disabled = false;
  document.getElementById('translateLetterBtn').disabled = false;
  document.getElementById('saveLetterBtn').disabled = false;
  document.getElementById('exportPdfBtn').disabled = false;
  document.getElementById('exportWordBtn').disabled = false;
  document.getElementById('copyEmailBtn').disabled = false;
  document.getElementById('openEmailBtn').disabled = false;
  document.getElementById('printBtn').disabled = false;
  document.getElementById('copyLetterBtn').disabled = false;
  addAuditLog(`Loaded historical referral: ${item.patientName}`);
}

document.getElementById('historySearch').addEventListener('input', (e) => {
  const query = e.target.value.toLowerCase();
  const history = JSON.parse(localStorage.getItem('referral_history')) || [];
  const historyList = document.getElementById('historyList');
  historyList.innerHTML = '';

  history.reverse().filter(item => item.patientName.toLowerCase().includes(query)).forEach(item => {
    const div = document.createElement('div');
    div.className = 'history-item';
    div.innerHTML = `<div class="history-item-name">${item.patientName}</div><div class="history-item-date">${item.timestamp}</div>`;
    div.addEventListener('click', () => loadFromHistory(item));
    historyList.appendChild(div);
  });
});

// ========== TEMPLATES ==========
function loadTemplates() {
  const templates = JSON.parse(localStorage.getItem('referral_templates')) || {};
  const templateSelect = document.getElementById('templateSelect');
  templateSelect.innerHTML = '<option value="">Load a template...</option>';

  Object.keys(templates).forEach(name => {
    const option = document.createElement('option');
    option.value = name;
    option.textContent = name;
    templateSelect.appendChild(option);
  });

  document.getElementById('deleteTemplateBtn').disabled = !Object.keys(templates).length;
}

document.getElementById('saveTemplateBtn').addEventListener('click', () => {
  const templateName = prompt('Enter template name (e.g., "Cardiology Referral"):');
  if (!templateName) return;

  let templates = JSON.parse(localStorage.getItem('referral_templates')) || {};

  templates[templateName] = {
    specialty: document.getElementById('specialty').value,
    hospital: document.getElementById('hospital').value,
    urgency: document.getElementById('urgency').value,
    medicalHistory: document.getElementById('medicalHistory').value,
    medications: document.getElementById('medications').value,
    allergies: document.getElementById('allergies').value,
    investigations: document.getElementById('investigations').value,
    physicalExam: document.getElementById('physicalExam').value,
    diagnosis: document.getElementById('diagnosis').value,
    message: document.getElementById('message').value
  };

  localStorage.setItem('referral_templates', JSON.stringify(templates));
  alert('Template saved!');
  loadTemplates();
  addAuditLog(`Template created: ${templateName}`);
});

document.getElementById('templateSelect').addEventListener('change', (e) => {
  if (!e.target.value) return;

  const templates = JSON.parse(localStorage.getItem('referral_templates')) || {};
  const template = templates[e.target.value];

  if (template) {
    document.getElementById('specialty').value = template.specialty;
    document.getElementById('hospital').value = template.hospital;
    document.getElementById('urgency').value = template.urgency;
    document.getElementById('medicalHistory').value = template.medicalHistory;
    document.getElementById('medications').value = template.medications;
    document.getElementById('allergies').value = template.allergies || '';
    document.getElementById('investigations').value = template.investigations;
    document.getElementById('physicalExam').value = template.physicalExam || '';
    document.getElementById('diagnosis').value = template.diagnosis;
    document.getElementById('message').value = template.message;
    e.target.value = '';
    addAuditLog(`Template loaded: ${e.target.options[e.target.selectedIndex - 1]?.text}`);
  }
});

document.getElementById('deleteTemplateBtn').addEventListener('click', () => {
  const templateSelect = document.getElementById('templateSelect');
  if (!templateSelect.value) {
    alert('Please select a template to delete.');
    return;
  }

  if (confirm('Delete this template?')) {
    let templates = JSON.parse(localStorage.getItem('referral_templates')) || {};
    const name = templateSelect.options[templateSelect.selectedIndex].text;
    delete templates[templateSelect.value];
    localStorage.setItem('referral_templates', JSON.stringify(templates));
    alert('Template deleted!');
    loadTemplates();
    addAuditLog(`Template deleted: ${name}`);
  }
});

// ========== INITIALIZATION ==========
window.addEventListener('load', () => {
  const savedGeminiKey = localStorage.getItem(GEMINI_API_KEY_STORAGE) || localStorage.getItem(LEGACY_LLM_API_KEY_STORAGE);
  if (llmApiKeyInput && savedGeminiKey) {
    llmApiKeyInput.value = savedGeminiKey;
  }
  loadHistory();
  loadTemplates();
  updateAppointmentDisplay();
  updateAuditDisplay();
  
  const draft = localStorage.getItem('referral_draft');
  if (draft) {
    const data = JSON.parse(draft);
    document.getElementById('patientName').value = data.patientName || '';
    document.getElementById('patientId').value = data.patientId || '';
    document.getElementById('patientAge').value = data.patientAge || '';
    document.getElementById('patientDob').value = data.patientDob || '';
    document.getElementById('patientSex').value = data.patientSex || '';
    document.getElementById('patientPhone').value = data.patientPhone || '';
    document.getElementById('patientEmail').value = data.patientEmail || '';
    document.getElementById('patientDetailDate').value = data.patientDetailDate || getLocalDateValue(new Date());
    document.getElementById('patientDetailTime').value = data.patientDetailTime || getLocalTimeValue(new Date());
    document.getElementById('receivingDocName').value = data.receivingDocName || '';
    document.getElementById('receivingDocPhone').value = data.receivingDocPhone || '';
    document.getElementById('receivingDocEmail').value = data.receivingDocEmail || '';
    document.getElementById('specialty').value = data.specialty || '';
    document.getElementById('hospital').value = data.hospital || '';
    document.getElementById('urgency').value = data.urgency || '';
    document.getElementById('referralStatus').value = data.referralStatus || 'Draft';
    document.getElementById('medicalHistory').value = data.medicalHistory || '';
    document.getElementById('medications').value = data.medications || '';
    document.getElementById('allergies').value = data.allergies || '';
    document.getElementById('investigations').value = data.investigations || '';
    document.getElementById('physicalExam').value = data.physicalExam || '';
    document.getElementById('diagnosis').value = data.diagnosis || '';
    document.getElementById('message').value = data.message || '';
    document.getElementById('followUpDate').value = data.followUpDate || '';
    document.getElementById('followUpReason').value = data.followUpReason || '';
    document.getElementById('appointmentType').value = data.appointmentType || '';
    if (data.patientDob && !data.patientAge) updateAgeFromDob();
    setPatientDateTime();
  }
  
  renderSpecialists();
  refreshAdvancedViews();
  addAuditLog('App loaded');
});
