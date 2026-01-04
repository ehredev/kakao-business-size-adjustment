// 설정 저장 및 로드
const resizeToggle = document.getElementById('resizeToggle');
const chatLogToggle = document.getElementById('chatLogToggle');

// 초기 설정 로드
chrome.storage.sync.get(['resizeEnabled', 'chatLogEnabled'], (result) => {
  resizeToggle.checked = result.resizeEnabled !== false; // 기본값 true
  chatLogToggle.checked = result.chatLogEnabled !== false; // 기본값 true
});

// 채팅창 크기 조절 토글
resizeToggle.addEventListener('change', () => {
  const enabled = resizeToggle.checked;
  chrome.storage.sync.set({ resizeEnabled: enabled }, () => {
    // 활성 탭에 메시지 전송
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        chrome.tabs.sendMessage(tabs[0].id, {
          type: 'toggleResize',
          enabled: enabled
        });
      }
    });
  });
});

// 채팅 로그 미리보기 토글
chatLogToggle.addEventListener('change', () => {
  const enabled = chatLogToggle.checked;
  chrome.storage.sync.set({ chatLogEnabled: enabled }, () => {
    // 활성 탭에 메시지 전송
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        chrome.tabs.sendMessage(tabs[0].id, {
          type: 'toggleChatLog',
          enabled: enabled
        });
      }
    });
  });
});
