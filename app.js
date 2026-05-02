// ========== MULTI-LANGUAGE SUPPORT ==========
const translations = {
  en: { patient: 'Patient', age: 'Age', sex: 'Sex', phone: 'Phone', email: 'Email' },
  es: { patient: 'Paciente', age: 'Edad', sex: 'Sexo', phone: 'Teléfono', email: 'Correo' },
  fr: { patient: 'Patient', age: 'Âge', sex: 'Sexe', phone: 'Téléphone', email: 'Email' }
};

let currentLanguage = 'en';

document.getElementById('languageSelect').addEventListener('change', (e) => {
  currentLanguage = e.target.value;
  updateRecognitionLanguage();
  addAuditLog(`Language changed to ${e.target.value.toUpperCase()}`);
  autoSave();
});

// ========== DARK MODE ==========
const darkModeBtn = document.getElementById('darkModeBtn');
const appShell = document.getElementById('appShell');

darkModeBtn.addEventListener('click', () => {
  document.body.classList.toggle('dark-mode');
  localStorage.setItem('darkMode', document.body.classList.contains('dark-mode'));
  darkModeBtn.textContent = document.body.classList.contains('dark-mode') ? '☀️' : '🌙';
});

// Load dark mode preference
if (localStorage.getItem('darkMode') === 'true') {
  document.body.classList.add('dark-mode');
  darkModeBtn.textContent = '☀️';
}

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

let mediaRecorder;
let audioChunks = [];
let audioBlob;
let recognition = null;
let dictationActive = false;

const dictationLanguageMap = {
  en: 'en-US',
  es: 'es-ES',
  fr: 'fr-FR'
};

function updateRecognitionLanguage() {
  if (recognition) {
    recognition.lang = dictationLanguageMap[currentLanguage] || 'en-US';
  }
}

function canUseSpeechRecognition() {
  return 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window;
}

function createSpeechRecognition() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) return null;
  const recog = new SpeechRecognition();
  recog.continuous = true;
  recog.interimResults = true;
  recog.lang = dictationLanguageMap[currentLanguage] || 'en-US';

  recog.onstart = () => {
    dictationActive = true;
    dictateBtn.textContent = '🛑 Stop Dictation';
    recordingStatus.textContent = 'Dictation active — speaking will fill the active field or referral reason.';
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
      appendDictationText(finalTranscript);
      recordingStatus.textContent = `Dictated: ${finalTranscript}`;
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
    recordingStatus.textContent = 'Dictation stopped.';
    addAuditLog('Voice dictation stopped');
  };

  return recog;
}

function getDictationTarget() {
  const active = document.activeElement;
  if (active && (active.tagName === 'TEXTAREA' || active.tagName === 'INPUT') && active.id !== 'fileAttachment') {
    return active;
  }
  return document.getElementById('message');
}

function appendDictationText(text) {
  const target = getDictationTarget();
  target.value = target.value ? `${target.value} ${text}` : text;
  autoSave();
  const output = document.getElementById('output');
  if (output.textContent && output.textContent.trim() !== 'Your generated referral will appear here.') {
    generateLetter();
  }
}

dictateBtn.addEventListener('click', () => {
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

  recognition.start();
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

document.getElementById('historyTemplate').addEventListener('change', (e) => {
  if (e.target.value && historyTemplates[e.target.value]) {
    document.getElementById('medicalHistory').value = historyTemplates[e.target.value];
    autoSave();
  }
});

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
  es: {
    hypertension: 'Presión arterial alta',
    diabetes: 'Diabetes mellitus',
    myocardial_infarction: 'Infarto de miocardio',
    cerebrovascular_accident: 'Accidente cerebrovascular',
    pneumonia: 'Neumonía',
    appendicitis: 'Apendicitis',
    cholecystitis: 'Colecistitis',
    gastroenteritis: 'Gastroenteritis',
    dermatitis: 'Dermatitis',
    arthritis: 'Artritis'
  },
  fr: {
    hypertension: 'Hypertension artérielle',
    diabetes: 'Diabète sucré',
    myocardial_infarction: 'Infarctus du myocarde',
    cerebrovascular_accident: 'Accident vasculaire cérébral',
    pneumonia: 'Pneumonie',
    appendicitis: 'Appendicite',
    cholecystitis: 'Cholécystite',
    gastroenteritis: 'Gastro-entérite',
    dermatitis: 'Dermatite',
    arthritis: 'Arthrite'
  },
  ar: {
    hypertension: 'ارتفاع ضغط الدم',
    diabetes: 'السكري',
    myocardial_infarction: 'النوبة القلبية',
    cerebrovascular_accident: 'السكتة الدماغية',
    pneumonia: 'الالتهاب الرئوي',
    appendicitis: 'التهاب الزائدة الدودية',
    cholecystitis: 'التهاب المرارة',
    gastroenteritis: 'التهاب المعدة والأمعاء',
    dermatitis: 'التهاب الجلد',
    arthritis: 'التهاب المفاصل'
  },
  zh: {
    hypertension: '高血压',
    diabetes: '糖尿病',
    myocardial_infarction: '心肌梗死',
    cerebrovascular_accident: '脑卒中',
    pneumonia: '肺炎',
    appendicitis: '阑尾炎',
    cholecystitis: '胆囊炎',
    gastroenteritis: '胃肠炎',
    dermatitis: '皮炎',
    arthritis: '关节炎'
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
  const patientAge = document.getElementById('patientAge').value.trim();
  const patientSex = document.getElementById('patientSex').value;
  const patientPhone = document.getElementById('patientPhone').value.trim();
  const patientEmail = document.getElementById('patientEmail').value.trim();
  
  const receivingDocName = document.getElementById('receivingDocName').value.trim();
  const specialty = document.getElementById('specialty').value;
  const hospital = document.getElementById('hospital').value.trim();
  const urgency = document.getElementById('urgency').value;
  const referralStatus = document.getElementById('referralStatus').value;
  
  const medicalHistory = document.getElementById('medicalHistory').value.trim();
  const medications = document.getElementById('medications').value.trim();
  const investigations = document.getElementById('investigations').value.trim();
  const diagnosis = document.getElementById('diagnosis').value.trim();
  const message = document.getElementById('message').value.trim();
  
  // Follow-up information
  const followUpDate = document.getElementById('followUpDate').value;
  const followUpReason = document.getElementById('followUpReason').value.trim();
  const appointmentType = document.getElementById('appointmentType').value;

  let output = `===============================================
MEDICAL REFERRAL LETTER
===============================================
Date: ${new Date().toLocaleDateString()}
Status: ${referralStatus}
Reference: REF-${new Date().getTime()}

PATIENT INFORMATION:
Name: ${patientName || 'N/A'}
Age: ${patientAge || 'N/A'} years | Sex: ${patientSex || 'N/A'}
Phone: ${patientPhone || 'N/A'}
Email: ${patientEmail || 'N/A'}

RECEIVING PHYSICIAN:
Dr. ${receivingDocName || 'N/A'}
Specialty: ${specialty || 'N/A'}
Hospital/Clinic: ${hospital || 'N/A'}
Urgency Level: ${urgency}

REFERRING PHYSICIAN:
Dr. ${profile.name || 'N/A'}
License: ${profile.license || 'N/A'}
Institution: ${profile.hospital || 'N/A'}

===============================================
CLINICAL INFORMATION:
===============================================
`;

  if (medicalHistory) output += `\nMEDICAL HISTORY:\n${medicalHistory}\n`;
  if (medications) output += `\nMEDICATIONS & ALLERGIES:\n${medications}\n`;
  if (investigations) output += `\nINVESTIGATIONS & FINDINGS:\n${investigations}\n`;
  if (diagnosis) output += `\nDIAGNOSIS & ASSESSMENT:\n${diagnosis}\n`;

  output += `\nREFERRAL REASON:\n${message || 'N/A'}`;
  
  // Add follow-up information
  if (followUpDate || followUpReason) {
    output += `\n\nFOLLOW-UP INFORMATION:\n`;
    if (followUpDate) output += `Suggested follow-up date: ${new Date(followUpDate).toLocaleDateString()}\n`;
    if (followUpReason) output += `Follow-up reason: ${followUpReason}\n`;
    if (appointmentType) output += `Appointment type: ${appointmentType}\n`;
  }
  
  if (signature) output += `\n\n[DIGITAL SIGNATURE ATTACHED]`;
  
  output += `\n\nAttachments: ${attachments.length} file(s)`;
  output += `\n===============================================`;

  document.getElementById('output').textContent = output;
  
  document.getElementById('editLetterBtn').disabled = false;
  document.getElementById('signLetterBtn').disabled = false;
  document.getElementById('exportPdfBtn').disabled = false;
  document.getElementById('printBtn').disabled = false;
  document.getElementById('saveHistoryBtn').disabled = false;
  document.getElementById('copyLetterBtn').disabled = false;
  
  saveState();
  addAuditLog(`Referral letter generated for ${patientName}`);
  autoSave();
}
  const profile = JSON.parse(localStorage.getItem('doctorProfile')) || {};
  const signature = localStorage.getItem('signature') || '';
  
  const patientName = document.getElementById('patientName').value.trim();
  const patientAge = document.getElementById('patientAge').value.trim();
  const patientSex = document.getElementById('patientSex').value;
  const patientPhone = document.getElementById('patientPhone').value.trim();
  const patientEmail = document.getElementById('patientEmail').value.trim();
  
  const receivingDocName = document.getElementById('receivingDocName').value.trim();
  const specialty = document.getElementById('specialty').value;
  const hospital = document.getElementById('hospital').value.trim();
  const urgency = document.getElementById('urgency').value;
  const referralStatus = document.getElementById('referralStatus').value;
  
  const medicalHistory = document.getElementById('medicalHistory').value.trim();
  const medications = document.getElementById('medications').value.trim();
  const investigations = document.getElementById('investigations').value.trim();
  const diagnosis = document.getElementById('diagnosis').value.trim();
  const message = document.getElementById('message').value.trim();

  let output = `===============================================
MEDICAL REFERRAL LETTER
===============================================
Date: ${new Date().toLocaleDateString()}
Status: ${referralStatus}
Reference: REF-${new Date().getTime()}

PATIENT INFORMATION:
Name: ${patientName || 'N/A'}
Age: ${patientAge || 'N/A'} years | Sex: ${patientSex || 'N/A'}
Phone: ${patientPhone || 'N/A'}
Email: ${patientEmail || 'N/A'}

RECEIVING PHYSICIAN:
Dr. ${receivingDocName || 'N/A'}
Specialty: ${specialty || 'N/A'}
Hospital/Clinic: ${hospital || 'N/A'}
Urgency Level: ${urgency}

REFERRING PHYSICIAN:
Dr. ${profile.name || 'N/A'}
License: ${profile.license || 'N/A'}
Institution: ${profile.hospital || 'N/A'}

===============================================
CLINICAL INFORMATION:
===============================================
`;

  if (medicalHistory) output += `\nMEDICAL HISTORY:\n${medicalHistory}\n`;
  if (medications) output += `\nMEDICATIONS & ALLERGIES:\n${medications}\n`;
  if (investigations) output += `\nINVESTIGATIONS & FINDINGS:\n${investigations}\n`;
  if (diagnosis) output += `\nDIAGNOSIS & ASSESSMENT:\n${diagnosis}\n`;

  output += `\nREFERRAL REASON:\n${message || 'N/A'}`;
  
  if (signature) output += `\n\n[DIGITAL SIGNATURE ATTACHED]`;
  
  output += `\n\nAttachments: ${attachments.length} file(s)`;
  output += `\n===============================================`;

  document.getElementById('output').textContent = output;
  
  document.getElementById('editLetterBtn').disabled = false;
  document.getElementById('signLetterBtn').disabled = false;
  document.getElementById('exportPdfBtn').disabled = false;
  document.getElementById('printBtn').disabled = false;
  document.getElementById('saveHistoryBtn').disabled = false;
  document.getElementById('copyLetterBtn').disabled = false;
  
  saveState();
  addAuditLog(`Referral letter generated for ${patientName}`);
  autoSave();


document.getElementById('generateBtn').addEventListener('click', generateLetter);

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
function autoSave() {
  const draft = {
    patientName: document.getElementById('patientName').value,
    patientAge: document.getElementById('patientAge').value,
    patientSex: document.getElementById('patientSex').value,
    patientPhone: document.getElementById('patientPhone').value,
    patientEmail: document.getElementById('patientEmail').value,
    receivingDocName: document.getElementById('receivingDocName').value,
    specialty: document.getElementById('specialty').value,
    hospital: document.getElementById('hospital').value,
    urgency: document.getElementById('urgency').value,
    referralStatus: document.getElementById('referralStatus').value,
    medicalHistory: document.getElementById('medicalHistory').value,
    medications: document.getElementById('medications').value,
    investigations: document.getElementById('investigations').value,
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
  setTimeout(() => indicator.classList.remove('active'), 500);
}

document.querySelectorAll('input, textarea, select').forEach(el => {
  el.addEventListener('change', autoSave);
});

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
  document.getElementById('patientAge').value = data.patientAge || '';
  document.getElementById('patientSex').value = data.patientSex || '';
  document.getElementById('patientPhone').value = data.patientPhone || '';
  document.getElementById('patientEmail').value = data.patientEmail || '';
  document.getElementById('receivingDocName').value = data.receivingDocName || '';
  document.getElementById('specialty').value = data.specialty || '';
  document.getElementById('hospital').value = data.hospital || '';
  document.getElementById('urgency').value = data.urgency || '';
  document.getElementById('referralStatus').value = data.referralStatus || '';
  document.getElementById('medicalHistory').value = data.medicalHistory || '';
  document.getElementById('medications').value = data.medications || '';
  document.getElementById('investigations').value = data.investigations || '';
  document.getElementById('diagnosis').value = data.diagnosis || '';
  document.getElementById('message').value = data.message || '';
  document.getElementById('followUpDate').value = data.followUpDate || '';
  document.getElementById('followUpReason').value = data.followUpReason || '';
  document.getElementById('appointmentType').value = data.appointmentType || '';
  
  alert('Draft loaded!');
  addAuditLog('Draft loaded');
});

// ========== EXPORT PDF ==========
document.getElementById('exportPdfBtn').addEventListener('click', () => {
  const element = document.getElementById('output');
  const opt = {
    margin: 10,
    filename: `referral_${new Date().getTime()}.pdf`,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2 },
    jsPDF: { orientation: 'portrait', unit: 'mm', format: 'a4' }
  };
  html2pdf().set(opt).from(element).save();
  addAuditLog('Letter exported as PDF');
});

// ========== PRINT ==========
document.getElementById('printBtn').addEventListener('click', () => {
  const printWindow = window.open('', '', 'height=600,width=800');
  printWindow.document.write(`<pre>${document.getElementById('output').textContent}</pre>`);
  printWindow.document.close();
  printWindow.print();
  addAuditLog('Letter printed');
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
      patientAge: document.getElementById('patientAge').value,
      patientPhone: document.getElementById('patientPhone').value,
      patientEmail: document.getElementById('patientEmail').value,
      receivingDocName: document.getElementById('receivingDocName').value,
      hospital: document.getElementById('hospital').value,
      urgency: document.getElementById('urgency').value,
      medicalHistory: document.getElementById('medicalHistory').value,
      medications: document.getElementById('medications').value,
      investigations: document.getElementById('investigations').value,
      diagnosis: document.getElementById('diagnosis').value,
      message: document.getElementById('message').value
    }
  });

  localStorage.setItem('referral_history', JSON.stringify(history));
  alert('Referral saved to history!');
  loadHistory();
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
  document.getElementById('patientAge').value = item.formData.patientAge || '';
  document.getElementById('patientPhone').value = item.formData.patientPhone || '';
  document.getElementById('patientEmail').value = item.formData.patientEmail || '';
  document.getElementById('receivingDocName').value = item.formData.receivingDocName || '';
  document.getElementById('specialty').value = item.specialty || '';
  document.getElementById('hospital').value = item.formData.hospital || '';
  document.getElementById('urgency').value = item.formData.urgency || '';
  document.getElementById('medicalHistory').value = item.formData.medicalHistory || '';
  document.getElementById('medications').value = item.formData.medications || '';
  document.getElementById('investigations').value = item.formData.investigations || '';
  document.getElementById('diagnosis').value = item.formData.diagnosis || '';
  document.getElementById('message').value = item.formData.message || '';
  document.getElementById('output').textContent = item.letter;
  document.getElementById('referralStatus').value = item.status || 'Draft';
  
  document.getElementById('editLetterBtn').disabled = false;
  document.getElementById('exportPdfBtn').disabled = false;
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
    investigations: document.getElementById('investigations').value,
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
    document.getElementById('investigations').value = template.investigations;
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
  loadHistory();
  loadTemplates();
  updateAppointmentDisplay();
  updateAuditDisplay();
  
  const draft = localStorage.getItem('referral_draft');
  if (draft) {
    const data = JSON.parse(draft);
    document.getElementById('patientName').value = data.patientName || '';
    document.getElementById('patientAge').value = data.patientAge || '';
    document.getElementById('patientSex').value = data.patientSex || '';
    document.getElementById('patientPhone').value = data.patientPhone || '';
    document.getElementById('patientEmail').value = data.patientEmail || '';
    document.getElementById('receivingDocName').value = data.receivingDocName || '';
    document.getElementById('specialty').value = data.specialty || '';
    document.getElementById('hospital').value = data.hospital || '';
    document.getElementById('urgency').value = data.urgency || '';
    document.getElementById('referralStatus').value = data.referralStatus || '';
    document.getElementById('medicalHistory').value = data.medicalHistory || '';
    document.getElementById('medications').value = data.medications || '';
    document.getElementById('investigations').value = data.investigations || '';
    document.getElementById('diagnosis').value = data.diagnosis || '';
    document.getElementById('message').value = data.message || '';
    document.getElementById('followUpDate').value = data.followUpDate || '';
    document.getElementById('followUpReason').value = data.followUpReason || '';
    document.getElementById('appointmentType').value = data.appointmentType || '';
  }
  
  addAuditLog('App loaded');
});
