// 카카오 비즈니스 채팅창 크기 조절 스크립트

function addResizeHandle() {
  const chatInputs = document.querySelectorAll('.write_chat3');

  chatInputs.forEach((chatInput) => {
    // 이미 resize handle이 추가되어 있는지 확인
    if (chatInput.querySelector('.resize-handle')) {
      return;
    }

    // resize handle 생성
    const resizeHandle = document.createElement('div');
    resizeHandle.className = 'resize-handle';
    resizeHandle.innerHTML = '<span class="resize-icon">⋮⋮</span>';

    // chatInput에 절대 위치 설정 (하단 고정)
    chatInput.style.position = 'fixed';
    chatInput.style.bottom = '0';
    chatInput.style.left = '0';
    chatInput.style.right = '0';
    chatInput.style.zIndex = '1000';
    chatInput.style.minHeight = '60px';

    // resize handle을 맨 앞에 추가 (상단에 위치하도록)
    chatInput.insertBefore(resizeHandle, chatInput.firstChild);

    // 드래그 기능 추가
    let isResizing = false;
    let startY = 0;
    let startHeight = 0;

    resizeHandle.addEventListener('mousedown', (e) => {
      isResizing = true;
      startY = e.clientY;
      startHeight = chatInput.offsetHeight;

      // 드래그 중 커서 변경 및 active 상태 추가
      document.body.style.cursor = 'ns-resize';
      document.body.style.userSelect = 'none';
      resizeHandle.classList.add('dragging');

      e.preventDefault();
    });

    document.addEventListener('mousemove', (e) => {
      if (!isResizing) return;

      const deltaY = startY - e.clientY; // 위로 드래그하면 양수
      const newHeight = startHeight + deltaY;

      // 최소/최대 높이 제한
      if (newHeight >= 60 && newHeight <= 800) {
        chatInput.style.height = newHeight + 'px';

        // textarea 높이만 조절 (메뉴는 그대로 유지)
        const textarea = chatInput.querySelector('.box_tf');
        if (textarea) {
          // resize handle(8px) + 메뉴/버튼 영역(약 50px) 제외
          const textareaHeight = Math.max(40, newHeight - 70);
          textarea.style.height = textareaHeight + 'px';
        }
      }
    });

    document.addEventListener('mouseup', () => {
      if (isResizing) {
        isResizing = false;
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
        resizeHandle.classList.remove('dragging');

        // 크기를 localStorage에 저장
        const currentHeight = chatInput.offsetHeight;
        localStorage.setItem('kakao-chat-height', currentHeight);
      }
    });

    // 더블클릭으로 기본 크기로 되돌리기
    resizeHandle.addEventListener('dblclick', () => {
      chatInput.style.height = 'auto';
      const textarea = chatInput.querySelector('.box_tf');
      if (textarea) {
        textarea.style.height = '40px';
      }
      // localStorage에서 저장된 높이 제거
      localStorage.removeItem('kakao-chat-height');
    });

    // 저장된 크기 복원
    const savedHeight = localStorage.getItem('kakao-chat-height');
    if (savedHeight) {
      chatInput.style.height = savedHeight + 'px';
      const textarea = chatInput.querySelector('.box_tf');
      if (textarea) {
        const textareaHeight = Math.max(40, parseInt(savedHeight) - 70);
        textarea.style.height = textareaHeight + 'px';
      }
    }
  });
}

// 설정 상태 저장
let resizeEnabled = true;
let chatLogEnabled = true;

// 초기 설정 로드
chrome.storage.sync.get(['resizeEnabled', 'chatLogEnabled'], (result) => {
  resizeEnabled = result.resizeEnabled !== false;
  chatLogEnabled = result.chatLogEnabled !== false;

  if (resizeEnabled) {
    addResizeHandle();
  }
  if (chatLogEnabled) {
    addHoverFetchListeners();
  }
});

// 메시지 리스너
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'toggleResize') {
    resizeEnabled = message.enabled;
    if (resizeEnabled) {
      addResizeHandle();
    } else {
      // resize handle 제거
      document.querySelectorAll('.resize-handle').forEach(handle => handle.remove());
    }
  } else if (message.type === 'toggleChatLog') {
    chatLogEnabled = message.enabled;
    if (!chatLogEnabled) {
      // 팝업 닫기
      const popup = document.querySelector('.chat-log-popup');
      if (popup) popup.remove();
    }
  }
});

const myId = window.location.href.match(/business\.kakao\.com\/id\/([^\/]+)/)?.[1];

// 채팅 로그 팝업 표시 함수
function showChatLogPopup(li, logs) {
  // 기존 팝업이 있으면 제거
  const existingPopup = document.querySelector('.chat-log-popup');
  if (existingPopup) {
    existingPopup.remove();
  }

  // 팝업 생성
  const popup = document.createElement('div');
  popup.className = 'chat-log-popup';

  // 채팅 로그 내용 생성
  let content = '<div class="chat-log-header">채팅 로그<button class="chat-log-close">✕</button></div>';
  content += '<div class="chat-log-content">';

  logs.forEach(log => {
    const managerName = log.manager?.name ? ` - ${log.manager.name}` : '';
    content += `
      <div class="chat-log-item">
        <span class="chat-log-nickname">${log.author.nickname}${managerName}</span>
        <span class="chat-log-message">${log.message}</span>
      </div>
    `;
  });

  content += '</div>';
  popup.innerHTML = content;

  // 스크롤을 최하단으로 이동
  const contentDiv = popup.querySelector('.chat-log-content');
  if (contentDiv) {
    setTimeout(() => {
      contentDiv.scrollTop = contentDiv.scrollHeight;
    }, 0);
  }

  // 위치 업데이트 함수
  const updatePosition = () => {
    const rect = li.getBoundingClientRect();
    popup.style.top = `${rect.top}px`;
    popup.style.right = '10px';
  };

  // 초기 위치 설정
  updatePosition();

  // 팝업을 body에 추가
  document.body.appendChild(popup);

  // 닫기 버튼 이벤트 리스너
  const closeBtn = popup.querySelector('.chat-log-close');
  if (closeBtn) {
    closeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      popup.remove();
      // 리스너 및 옵저버 정리
      if (typeof liObserver !== 'undefined') {
        liObserver.disconnect();
      }
      if (scrollContainer) {
        scrollContainer.removeEventListener('scroll', scrollHandler);
      }
      window.removeEventListener('scroll', scrollHandler);
    });
  }

  // 스크롤 이벤트 리스너 추가
  const scrollHandler = () => {
    updatePosition();
  };

  // 스크롤 가능한 컨테이너 찾기
  const scrollContainer = document.querySelector('.ReactVirtualized__Grid__innerScrollContainer')?.parentElement;
  if (scrollContainer) {
    scrollContainer.addEventListener('scroll', scrollHandler);
  }
  window.addEventListener('scroll', scrollHandler);

  // li가 DOM에서 제거되었는지 감시
  const liObserver = new MutationObserver(() => {
    // li가 더 이상 DOM에 없으면 팝업 닫기
    if (!document.body.contains(li)) {
      popup.remove();
      liObserver.disconnect();
      if (scrollContainer) {
        scrollContainer.removeEventListener('scroll', scrollHandler);
      }
      window.removeEventListener('scroll', scrollHandler);
    }
  });

  // li의 부모 요소를 감시
  if (li.parentElement) {
    liObserver.observe(li.parentElement, {
      childList: true,
      subtree: false
    });
  }

  // 팝업 외부 클릭 시 닫기
  const closePopup = (e) => {
    if (!popup.contains(e.target) && !li.contains(e.target)) {
      popup.remove();
      // 리스너 및 옵저버 정리
      liObserver.disconnect();
      if (scrollContainer) {
        scrollContainer.removeEventListener('scroll', scrollHandler);
      }
      window.removeEventListener('scroll', scrollHandler);
      document.removeEventListener('click', closePopup);
    }
  };

  // 약간의 지연 후 이벤트 리스너 추가 (즉시 추가하면 생성 클릭으로 닫힐 수 있음)
  setTimeout(() => {
    document.addEventListener('click', closePopup);
  }, 50);
}

// 채팅 리스트에 hover fetch 기능 추가
function addHoverFetchListeners() {
  const container = document.querySelector('.ReactVirtualized__Grid__innerScrollContainer');
  if (!container) return;

  const listItems = container.querySelectorAll('li');

  listItems.forEach((li) => {
    // 이미 리스너가 추가되어 있는지 확인
    if (li.dataset.hoverListenerAdded) return;
    li.dataset.hoverListenerAdded = 'true';

    let hoverTimer = null;

    li.addEventListener('mouseenter', () => {
      // 채팅 로그 기능이 비활성화되어 있으면 실행하지 않음
      if (!chatLogEnabled) return;

      // 2초 타이머 시작
      hoverTimer = setTimeout(() => {
        // 타이머 실행 시점에도 다시 체크
        if (!chatLogEnabled) return;

        // item_inp 클래스를 가진 div 찾기
        const itemInp = li.querySelector('.item_inp');
        if (!itemInp) return;

        // input의 id 가져오기
        const input = itemInp.querySelector('input');
        if (!input || !input.id) return;

        const chatId = input.id.replace('chat-select-', '');
        if (!chatId) return;

        // fetch 실행
        fetch(`https://business.kakao.com/api/profiles/_xkXFPs/chats/${chatId}/chatlogs`, {
          credentials: "include"
        })
          .then(response => response.json())
          .then(data => {
            // 팝업 생성
            showChatLogPopup(li, data.items);
          })
          .catch(error => {
            console.error(`Failed to fetch chat logs for ${chatId}:`, error);
          });
      }, 1000); // 2초
    });

    li.addEventListener('mouseleave', () => {
      // 타이머 취소
      if (hoverTimer) {
        clearTimeout(hoverTimer);
        hoverTimer = null;
      }
    });
  });
}

// DOM 변경 감지 (동적으로 추가되는 채팅창 대응)
const observer = new MutationObserver(() => {
  if (resizeEnabled) {
    addResizeHandle();
  }
  if (chatLogEnabled) {
    addHoverFetchListeners();
  }
});

observer.observe(document.body, {
  childList: true,
  subtree: true
});
