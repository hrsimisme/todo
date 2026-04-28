// --- 1. 전역 상태 및 초기 설정 ---
const TOTAL_TIME = 600; 
let timeLeft = TOTAL_TIME;
let timerId = null;
let listboxCount = 0;

// --- 1. 날짜 표시 설정 (initHeader) ---
function initHeader() {
    const $dateEl = $('#current-date');
    const now = new Date();
    
    // 요일, 월, 일을 따로 추출하기 위한 설정
    const formatter = new Intl.DateTimeFormat('en-US', { 
        month: 'long', 
        day: 'numeric', 
        weekday: 'short' 
    });
    
    // 데이터를 각각의 조각으로 나눕니다.
    const parts = formatter.formatToParts(now);
    const month = parts.find(p => p.type === 'month').value;
    const day = parts.find(p => p.type === 'day').value;
    const weekday = parts.find(p => p.type === 'weekday').value;

    // 원하는 순서대로 조립! "April 24, Fri"
    $dateEl.text(`${month} ${day}, ${weekday}`);
}


// 제이쿼리 객체로 선택
const $rings = $('.timer-progress'); 
const $timeDisplays = $('.time-text');
const $startBtn = $('#start-stop');
const $resetBtn = $('#reset');
const $mobileTimerBtn = $('#mobile-timer-btn');

const circumference = 2 * Math.PI * 45; 

// 초기화: 모든 원에 둘레 설정
$rings.css({
    'stroke-dasharray': `${circumference} ${circumference}`,
    'stroke-dashoffset': "0"
});

// --- 2. 타이머 핵심 함수 ---
function updateTimerUI() {
    const mins = Math.floor(timeLeft / 60);
    const secs = timeLeft % 60;
    const timeStr = `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    const progress = timeLeft / TOTAL_TIME;
    
    // 텍스트 업데이트
    $timeDisplays.text(timeStr);
    if ($mobileTimerBtn.length) $mobileTimerBtn.text(timeStr);

    // 게이지 업데이트
    const offset = circumference - (progress * circumference);
    $rings.each(function() {
        $(this).attr('stroke-dashoffset', offset);
        $(this).css({
            'stroke-dashoffset': offset + "px"
        });
    });
}

function startTimer() {
    if (timerId) return;
    $startBtn.text('STOP').css('background-color', '#ff4d4d');

    timerId = setInterval(() => {
        timeLeft--;
        updateTimerUI();
        if (timeLeft <= 0) {
            clearInterval(timerId);
            timerId = null;
            alert("집중 시간이 끝났습니다! 🎉");
            resetTimer();
        }
    }, 1000);
}

function stopTimer() {
    clearInterval(timerId);
    timerId = null;
    $startBtn.text('START').css('background-color', '');
}

function resetTimer() {
    stopTimer();
    timeLeft = TOTAL_TIME;
    updateTimerUI();
}

// --- 3. 이벤트 리스너 ---
$startBtn.on('click', () => {
    timerId ? stopTimer() : startTimer();
});

$resetBtn.on('click', resetTimer);

// 시간 클릭 시 수정 모드 (이벤트 위임)
$(document).on('click', '.time-text', function() {
    if (timerId) return;

    const $this = $(this);
    const [currentMin, currentSec] = $this.text().split(':');

    const $container = $('<div class="timer-edit-container"></div>');
    
    const createInput = (val) => {
        return $('<input type="text" maxlength="2" class="timer-split-input">')
            .val(val)
            .on('input', function() {
                this.value = this.value.replace(/[^0-9]/g, '');
            });
    };

    const $minInput = createInput(currentMin);
    const $secInput = createInput(currentSec);

    $container.append($minInput, ':', $secInput);
    $this.empty().append($container);
    $minInput.focus().select();

    const saveTime = () => {
        let m = parseInt($minInput.val()) || 0;
        let s = parseInt($secInput.val()) || 0;
        if (s > 59) s = 59;
        timeLeft = (m * 60) + s;
        updateTimerUI();
    };

    $container.on('keydown', (e) => {
        if (e.key === 'Enter') saveTime();
        if (e.key === 'Escape') updateTimerUI();
    });

    $minInput.add($secInput).on('blur', function(e) {
        if (!$container.has(e.relatedTarget).length) saveTime();
    });
});

// --- quote ---

// --- 명언 데이터 배열 ---
const quotes = [
    { text: "언제나 현재에 집중할 수 있다면 마음의 짐을 덜 수 있다.", author: "파울로 코엘료" },
    { text: "시작하는 방법은 말하기를 그만두고 행동하는 것이다.", author: "월트 디즈니" },
    { text: "성공은 최종적인 것이 아니며, 실패는 치명적인 것이 아니다. 중요한 것은 지속하려는 용기다.", author: "윈스턴 처칠" },
    { text: "여러분의 시간은 한정되어 있습니다. 다른 사람의 삶을 사느라 시간을 낭비하지 마세요.", author: "스티브 잡스" },
    { text: "미래는 자신의 꿈이 아름답다는 것을 믿는 사람들의 것이다.", author: "엘리너 루즈벨트" },
    { text: "매일 당신을 두렵게 만드는 일을 하나씩 하세요.", author: "엘리너 루즈벨트" },
    { text: "실천이 말보다 낫다.", author: "벤자민 프랭클린" },
    { text: "가장 큰 위험은 아무런 위험도 감수하지 않는 것이다.", author: "마크 저커버그" },
    { text: "오늘 할 수 있는 일을 내일로 미루지 마라.", author: "벤자민 프랭클린" }
];

// --- 매일 다른 명언을 불러오는 함수 ---
function displayDailyQuote() {
    const $quoteText = $('#daily-quote');
    const $quoteAuthor = $('#quote-author');

    // 오늘 날짜를 기준으로 인덱스 생성 (날짜가 같으면 같은 숫자가 나옴)
    const now = new Date();
    const dateStamp = now.getFullYear() + (now.getMonth() + 1) + now.getDate();
    
    // 명언 배열의 길이를 넘지 않도록 나머지 연산(%) 사용
    const index = dateStamp % quotes.length;
    const todayQuote = quotes[index];

    // 화면에 적용
    $quoteText.text(`"${todayQuote.text}"`);
    $quoteAuthor.text(`- ${todayQuote.author}`);
}

// --- 실행 ---
$(document).ready(function() {
    initHeader(); // 기존 함수
    displayDailyQuote(); // 명언 추가
    // ... 나머지 초기화 코드
});

// --- 4. 리스트 관련 ---

// [공통] 통계 및 디자인 업데이트
function updateListStats($listBox) {
    const total = $listBox.find('.todo-check').length;
    const completed = $listBox.find('.todo-check:checked').length;
    const $countDisplay = $listBox.find('.count');

    if (total > 0 && completed === total) {
        $countDisplay.css('color', 'var(--accent-green)').text('Well done !');
    } else {
        $countDisplay.css('color', '').text(`${completed}/${total}`);
    }
}

// [공통] 폭죽 효과
function fireConfetti($listBox) {
    const total = $listBox.find('.todo-check').length;
    const completed = $listBox.find('.todo-check:checked').length;
    if (total > 0 && completed === total) {
        confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
    }
}

// [공통] 개별 줄(Item) 이벤트 연결 함수
function setupItemEvents($item, $container) {
    const $input = $item.find('.item-input');
    const $check = $item.find('.todo-check');
    const $delBtn = $item.find('.delete-item-btn');

    $check.on('change', function() {
        const $box = $(this).closest('.list-box');
        updateListStats($box); 
        fireConfetti($box);
        $input.css({
            'text-decoration': this.checked ? "line-through" : "none",
            'color': this.checked ? "#aaa" : "inherit"
        });
    });

    $delBtn.on('click', () => {
        if (confirm("리스트를 삭제할까요?")) {
            const $box = $item.closest('.list-box');
            $item.remove();
            updateListStats($box); 
        }
    });

    $input.on('keydown', function(e) {
        if (e.originalEvent.isComposing) return;
        if (e.key === 'Enter') {
            const val = $.trim($(this).val());
            if (val !== "") {
                e.preventDefault();
                addNewItem($container);
            }
        }
    });
}

// [공통] 빈 칸 체크 함수 (규칙 2)
function canAddNewItem($container) {
    const $listBox = $container.closest('.list-box');
    const $listInput = $listBox.find('.list-input');
    
    // Everyday 섹션이 아닐 때만 제목 체크 (Everyday는 제목 입력창이 없으므로)
    if ($listInput.length > 0 && $.trim($listInput.val()) === "") {
        alert('리스트 제목을 입력하세요');
        $listInput.focus();
        return false;
    }

    const $items = $container.find('.todo-item');
    let hasEmpty = false;
    $items.each(function() {
        if ($.trim($(this).find('.item-input').val()) === "") {
            hasEmpty = true;
            return false;
        }
    });
    if (hasEmpty) {
        alert('할 일을 입력하세요');
        return false;
    }
    return true;
}

// [공통] 새로운 줄 추가
function addNewItem($container) {
    if (!canAddNewItem($container)) return; 

    const $newItem = $($('#item-template').prop('content')).clone().find('.todo-item');
    setupItemEvents($newItem, $container);
    $container.append($newItem);
    $newItem.find('.item-input').focus();
}

// 메인 리스트 박스 추가 버튼
$('#add-list-box-btn').on('click', function() {
    let canProceed = true;
    $('#list-container .done-btn').each(function() {
        if ($(this).text().toLowerCase() === 'done') {
            $(this).trigger('click'); 
            if ($(this).text().toLowerCase() === 'done') {
                canProceed = false; 
                return false;
            }
        }
    });

    if (!canProceed) return;

    listboxCount++;
    const listboxId = `listbox-${listboxCount}`;
    const $newListBox = $($('#list-template').prop('content')).clone().find('.list-box');
    $newListBox.attr('id', listboxId);

    const $todoList = $newListBox.find('.todo-list');
    const $doneBtn = $newListBox.find('.done-btn');

    // 첫 줄 자동 생성
    const $firstItem = $($('#item-template').prop('content')).clone().find('.todo-item');
    setupItemEvents($firstItem, $todoList);
    $todoList.append($firstItem);

    $newListBox.find('.add-item-row').on('click', function() {
        addNewItem($todoList);
    });

    $doneBtn.on('click', function() {
        const $currentListBox = $(this).closest('.list-box'); 
        const $currentTodoList = $currentListBox.find('.todo-list');
        const $listInput = $currentListBox.find('.list-input');
        const $items = $currentTodoList.find('.todo-item');
        const isDone = $(this).text().toLowerCase() === 'done';

        if (isDone) {
            if ($.trim($listInput.val()) === "") {
                alert('리스트 제목을 입력하세요');
                $listInput.focus();
                return;
            }

            let validCount = 0;
            $items.each(function() {
                const $input = $(this).find('.item-input');
                if ($.trim($input.val()) === "") {
                    $(this).remove();
                } else {
                    $input.prop('disabled', true).css({'background': 'transparent', 'border': 'none'});
                    validCount++;
                }
            });

            if (validCount === 0) {
                alert('최소 한 개의 할 일은 입력해야 합니다.');
                if ($currentTodoList.find('.todo-item').length === 0) {
                    const $retryItem = $($('#item-template').prop('content')).clone().find('.todo-item');
                    setupItemEvents($retryItem, $currentTodoList);
                    $currentTodoList.append($retryItem);
                    $retryItem.find('.item-input').focus();
                }
                return;
            }

            $listInput.prop('disabled', true);
            $currentListBox.find('.add-item-row, .delete-item-btn').hide();
            $(this).text('edit');
            updateListStats($currentListBox);
        } else {
            $items.find('.item-input').prop('disabled', false).css('background', '');
            $listInput.prop('disabled', false);
            $currentListBox.find('.add-item-row, .delete-item-btn').show();
            $(this).text('done');
        }
    });

    $('#list-container').append($newListBox);
});

// Everyday 섹션 초기화
function initEverydaySection() {
    const $everydaySection = $('.everyday-section');
    const $todoList = $everydaySection.find('.todo-list');
    const $doneBtn = $everydaySection.find('.done-btn');
    const $addRow = $everydaySection.find('.add-item-row');

    $addRow.on('click', function() {
        addNewItem($todoList);
    });

    $doneBtn.on('click', function() {
        const $currentBox = $(this).closest('.list-box');
        const $items = $currentBox.find('.todo-item');
        const isDone = $(this).text().toLowerCase() === 'done';

        if (isDone) {
            $items.each(function() {
                const $input = $(this).find('.item-input');
                if ($.trim($input.val()) === "") $(this).remove();
                else $input.prop('disabled', true).css({'background': 'transparent', 'border': 'none'});
            });
            $addRow.hide();
            $currentBox.find('.delete-item-btn').hide();
            $(this).text('edit');
            updateListStats($currentBox);
        } else {
            $items.find('.item-input').prop('disabled', false).css({'background': '', 'border': ''});
            $addRow.show();
            $currentBox.find('.delete-item-btn').show();
            $(this).text('done');
        }
    });
}

initEverydaySection();

// --- 5. 편집 모드 및 드래그앤드롭 ---

let isMainEditMode = false;

$('#main-edit-all').on('click', function() {
    isMainEditMode = !isMainEditMode;
    const $container = $('#list-container');

    if (isMainEditMode) {
        $(this).text('save').css('background-color', 'var(--accent-green)').css('color', 'var(--white-txt)');
        $container.addClass('edit-mode');
        $('.delete-list-btn').show();
        $('.add-main-btn').hide();
        enableDragAndDrop(); 
    } else {
        $(this).text('main edit').css('background-color', '').css('color', '');
        $container.removeClass('edit-mode');
        $('.delete-list-btn').hide();
        $('.add-main-btn').show();
        disableDragAndDrop();
    }
});

function enableDragAndDrop() {
    const $mainBoxes = $('#list-container > .list-box'); 
    $mainBoxes.attr('draggable', true);

    $mainBoxes.on('dragstart', function() { $(this).addClass('dragging'); });
    $mainBoxes.on('dragend', function() { $(this).removeClass('dragging'); });

    $('#list-container').off('dragover').on('dragover', function(e) {
        e.preventDefault();
        const draggingItem = document.querySelector('.dragging');
        if (!draggingItem || !$(draggingItem).parent().is('#list-container')) return;

        const siblings = [...this.querySelectorAll('.list-box:not(.dragging)')];
        const nextSibling = siblings.find(sibling => {
            return e.clientY <= sibling.offsetTop + sibling.offsetHeight / 2;
        });

        if (nextSibling) $(draggingItem).insertBefore(nextSibling);
        else $(this).append(draggingItem);
    });
}

function disableDragAndDrop() {
    $('#list-container > .list-box').attr('draggable', false).off('dragstart dragend');
    $('#list-container').off('dragover');
}

// 섹션 삭제
$('#list-container').on('click', '.delete-list-btn', function() {
    const $parentBox = $(this).closest('.list-box');
    const listName = $parentBox.find('.list-input').val();
    const displayName = listName.trim() === "" ? "이 카테고리" : `"${listName}"`;

    if (confirm(displayName + "를 삭제할까요?")) {
        $parentBox.remove();
    }
});

updateTimerUI();

$(document).ready(function() {
    initHeader();
    checkDailyReset();
    updateTimerUI(); // 타이머 초기 화면 설정
});