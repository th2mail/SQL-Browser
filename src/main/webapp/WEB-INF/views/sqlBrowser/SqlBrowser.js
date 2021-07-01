/**
    파일명 : SqlBrowser.js
    설  명 : SQL-Browser JS 파일(코드영역)    

    수정자      수정일      수정내용 
    ------      --------    ----------------------------------------------------------
    kth      21.01.15    최초작성
*/

// import
import SETTING from '../../common/Setting.js'
import Common from '../../lib/Common.js'
import Grid from '../../common/utils/Grid.js'

// code area
$(function(){
    new SqlBrowser().init();
});

// class area
class SqlBrowser extends Common {

    /*************************************************************************************************************************
     * 
     * 생성자
     * 
     ************************************************************************************************************************/
    constructor() {
        super();
        
        this.selectedDb_s = '';     // 선택된 DB명
        this.selectedQuery_s = ''   // 선택된 쿼리문

        this.$grid = $("#list");
        // Variables
        this.req_o = {};            // 요청 오브젝트
        this.grid = new Grid();     // 그리드 객체
        this.header_a = new Array(); 
        let splitter_size_i = 30;   // 세로 스플리터
    }

    /*************************************************************************************************************************
     * 함 수 명 : ininit
     * 기능설명 : 초기화 함수
     *              1. 컨트롤 초기화
     *              2. 이벤트 등록
     *              3. 최초 조회
     * 파라미터 : 
     ************************************************************************************************************************/
    init() {
        this.initCtrl();    // 컨트롤 초기화
        this.initEvt();     // 이벤트 등록
        this.selectList();  // 최초 조회(상세화면은 selectDetailList)

        let objThis = this;
        $('.btn-example').click(function(){
            
            var $href = $(this).attr('href');
            
            objThis.layer_popup($href);
        });
    }

    layer_popup(el){
        var $el = $(el);    //레이어의 id를 $el 변수에 저장
        var isDim = $el.prev().hasClass('dimBg'); //dimmed 레이어를 감지하기 위한 boolean 변수

        isDim ? $('.dim-layer').fadeIn() : $el.fadeIn();

        var $elWidth = ~~($el.outerWidth()),
            $elHeight = ~~($el.outerHeight()),
            docWidth = $(document).width(),
            docHeight = $(document).height();

        // 화면의 중앙에 레이어를 띄운다.
        if ($elHeight < docHeight || $elWidth < docWidth) {
            $el.css({
                marginTop: -$elHeight /2,
                marginLeft: -$elWidth/2
            })
        } else {
            $el.css({top: 0, left: 0});
        }

        $el.find('a.btn-layerClose').click(function(){
            isDim ? $('.dim-layer').fadeOut() : $el.fadeOut(); // 닫기 버튼을 클릭하면 레이어가 닫힌다.
            return false;
        });

        $('.layer .dimBg').click(function(){
            $('.dim-layer').fadeOut();
            return false;
        });
    }

    /*************************************************************************************************************************
     * 함 수 명 : initCtrl
     * 기능설명 : 컨트롤 초기화
     *              1. 페이지 로딩 시, 초기화가 필요한 컨트롤을 세팅한다.
     *                 (트리, 셀렉트박스, 그리드, 탭 등)
     *              2. 이벤트 등록
     *              3. 최초 조회
     * 파라미터 : 
     * 개선방향 : 
     *              1. 지금은 각각의 컨트롤 마다 ajax 를 호출하여 초기화 하였지만...
     *                 이 방법 말고 페이지 로딩 시, dom 을 순회하면서 엘리먼트의 태그/속성을 보고 초기화 하는 기능을 만들어보자!!!
     ************************************************************************************************************************/
    initCtrl() {
        // Tree 초기화
        this.req_o = { 
            url : this.constructor.name, 
            cmd : `selectSchemaList`, 
            opt : {}, 
            ctrl_nm : `jt_db`, 
            ctrl_opt : `${SETTING.CONTROL_OPTION.TREE}` 
        };
        super.ajaxCall(this.req_o); 
        
        // SelectBox 초기화
        this.req_o = { 
            url : this.constructor.name, 
            cmd : `selectDBList`, 
            opt : {}, 
            ctrl_nm : `sb_db`, 
            ctrl_opt : `${SETTING.CONTROL_OPTION.SELECTBOX}` 
        };
        super.ajaxCall(this.req_o);

        // jQuery 탭 초기화
        $("#tabs").tabs();

        // w2ui Grid 초기화
        this.req_o = {
            name        : `list`,
            style       : `width: 100%; height: 235px; font-size: 5px; color: blue;`,
            lineNumbers : true
        }
        this.grid.init(this.req_o);
    }   

    /*************************************************************************************************************************
     * 함 수 명 : initEvt
     * 기능설명 : 이벤트 등록
     *              1. jQuery 등
     * 파라미터 : 
     ************************************************************************************************************************/
    initEvt() {
        let objThis = this;        

        // 메뉴바 이벤트 등록
        this.initMenubarEvt(this);
        
        // 도구모음 이벤트 등록
        this.initToolbarEvt(this);

        // Left 이벤트 등록(selectBox, Tree)
        this.initLeftEvt(this);          

        // 텍스트에어리어에서 선택한 구문 가져오기
        $( "#sql" ).on("mouseup", function() {
            var txtArea = document.getElementById("sql");
            var selectedQuery_s;   
                 
            if (txtArea.selectionStart != undefined) {    
                var startPosition = txtArea.selectionStart;
                var endPosition = txtArea.selectionEnd;
                selectedQuery_s = txtArea.value.substring(startPosition, endPosition);
            }

            objThis.selectedQuery_s = selectedQuery_s;
        });

        $(window).on("beforeunload", function(){
            return `나가시겠습니까?`;
        });        

        // 드래그 이벤트
        $("#splitter").on("drag", function(ev){
            console.log("Drag: ", ev);
            var option = `${ev.clientX}px 10px 1fr`            
            console.log(`option: ${option}`)        
            $('.container').css({
                "grid-template-columns" : option
            });
        });     

        $("#splitter").on("dragend", function(ev){
            console.log("DragEnd: ", ev);
            var option = `${ev.clientX}px 10px 1fr`            
            console.log(`option: ${option}`)        
            $('.container').css({
                "grid-template-columns" : option
            });
        });
    }

    /**
     * 함 수 명 : initMenubarEvt
     * 기능설명 : 메뉴바 이벤트 등록
     * 파라미터 : objThis
     */
    initMenubarEvt(objThis) {
        // 메뉴 이벤트 : Home
        $("#menubar_home").on("click", function(event){
            event.preventDefault();
            window.location.href = `${SETTING.PAGE_HOME}`;
            return false;
        });

        // 메뉴 이벤트 : File - Open 클릭 이벤트
        $("#menubar_open").on("click", function(event){
            var input = document.createElement("input");
            input.type = "file";
            input.accept = "text/plain,.sql"; // 확장자가 xxx, yyy 일때, ".xxx, .yyy"
            input.onchange = function(event){
                objThis.readToFile(event.target.files[0]);
            };
            input.click();
        });

        // 메뉴 이벤트 : File - Save as 클릭 이벤트
        $("#menubar_saveas").on("click", function(event){            
            let filename = prompt("저장할 파일명을 입력해주세요.", "sample.sql");
            objThis.saveToFile(filename, $("#sql").val(), window);
        });

        // 메뉴 이벤트 : File - Close 클릭 이벤트
        $("#close").on("click", function(event){
            event.preventDefault();
            window.open('', '_self', '').close();
            return false;
        });  
    }

    /**
     * 함 수 명 : initToolbarEvt
     * 기능설명 : 도구모음 이벤트 등록
     * 파라미터 : objThis
     */
    initToolbarEvt(objThis) {  
        let constructorName = this.constructor.name;    // 클래스명
        let req_o           = this.req_o;               // 요청 오브젝트
        let ajaxCall        = super.ajaxCall;           // ajax 함수
        let cbRun           = this.cbRun;               // 콜백함수 : 실행 버튼 클릭 이벤트

        // 새파일 이미지 클릭 이벤트
        $("#icon_file").on("click", function(){
            objThis.doFadeInOut($(this));

            console.log("새파일 이미지 클릭");
        });

        // 파일열기 이미지 클릭 이벤트
        $("#icon_folder").on("click", function(){
            objThis.doFadeInOut($(this));

            var input = document.createElement("input");
            input.type = "file";
            input.accept = "text/plain,.sql"; // 확장자가 xxx, yyy 일때, ".xxx, .yyy"
            input.onchange = function(event){
                objThis.readToFile(event.target.files[0]);
            };
            input.click();
        });

        // 저장 이미지 클릭 이벤트
        $("#icon_save").on("click", function(){
            objThis.doFadeInOut($(this));

            let filename = prompt("저장할 파일명을 입력해주세요.", "sample.sql");
            objThis.saveToFile(filename, $("#sql").val(), window);
        });

        // 실행 이미지 클릭 이벤트
        $("#icon_play").on("click", function() {
            // SQL 구문을 실행할 DB가 선택되었는지 먼저 확인한다(SelectBox 에 선택된 값이 있는지 확인한다.).
            let dbname_s = $("#sb_db").children("option:selected").val(); // or $("#sb_db").val();
            let sql_s = ''

            if ( objThis.selectedQuery_s.length > 0 ) {
                sql_s = objThis.selectedQuery_s;
            } else {
                sql_s = $("#sql").val();
            }
            sql_s = sql_s.replace(/(\r\n\t|\n|\r\t)/gm," "); 
            // console.log(`sql_s = ${sql_s}`)

            if ( !dbname_s ) {
                alert(`데이터베이스를 선택해주세요.`);
                return;
            } else if ( !sql_s ) {
                alert(`SQL 문을 입력해주세요.`);
                return;
            }

            objThis.doFadeInOut($(this));

            // 그리고, 입력된 구문이 실행 가능한 올바른 구문인지 validation 체크한다.
            // 
            // 또는 validation 체크하는 대신에...
            // 사용자가 입력한 SQL 구문을 DB 에서 실행하고 
            // 실행결과(리턴값, 에러 메세지 등...) 정보를 Output 또는 Message 창에 출력한다.

            // w2ui =====================================================
            // 기존 데이터 삭제
            w2ui['list'].clear();
            w2ui['list'].refresh();

            // 기존 컬럼 삭제
            for (let i=0; i<objThis.header_a.length; i++){
                w2ui['list'].removeColumn(objThis.header_a[i]);
            }
            objThis.header_a = [];
            w2ui['list'].refresh();
            //============================================================

            // ajax 조회
            req_o = {
                url : constructorName,
                cmd : `executeQueryList`, 
                opt : `{"db": "${dbname_s}", "sql": "${sql_s}"}`
            };
            ajaxCall(req_o, cbRun, objThis);
        });

        $("#icon_stop").on("click", function(){
            objThis.doFadeInOut($(this));

            console.log("중지 이미지 클릭");
        });

        $("#icon_down").on("click", function(){
            objThis.doFadeInOut($(this));

            console.log("아래로 펼치기 이미지 클릭");
        });

        $("#icon_left").on("click", function(){
            objThis.doFadeInOut($(this));

            console.log("왼쪽으로 펼치기 이미지 클릭");
        });
    }

     /**
     * 함 수 명 : initToolbarEvt
     * 기능설명 : Left 이벤트 등록(selectBox, Tree)
     * 파라미터 : 
     */
     initLeftEvt(objThis) {

        /**
         * 데이터베이스 셀렉트박스 체인지 이벤트
         */
        $("#sb_db").on("change", function() {
            // 선택한 데이터베이스의 값을 가져온다
            let selectedDb_s = '#' + $(this).val() + '_lvl01_anchor';            

            if (objThis.selectedDb_s != '') {                           // 이전에 선택된 데이터베이스 값이 있으면
                $(objThis.selectedDb_s).css("font-weight", "normal");   // 글씨 굵기를 원래대로   바꾼다
                $(objThis.selectedDb_s).css("color", "black");          // 글씨 색깔을 검정색으로 바꾼다
            }

            // 방금 선택된 데이터베이스 아이템의
            $(selectedDb_s).css("font-weight", "bold");                 // 글씨 굵기를 진하게     바꾼다
            $(selectedDb_s).css("color", "blue");                       // 글씨 색깔을 파란색으로 바꾼다
            
            $("#jt_db").jstree("close_all");                            // Tree 모든 항목 접기
            $("#jt_db").jstree("open_node", selectedDb_s);              // 선택된 데이터베이스 아이템 펼치기

            // 선택한 데이터베이스의 값을 this 에 저장한다.
            // (이전에 선택한 데이터베이스의 값을 알고자 사용하였다.)
            objThis.selectedDb_s = selectedDb_s;
        });

        /**
         * 데이터베이스 목록 트리 더블클릭 이벤트
         */
        $("#jt_db").bind("dblclick.jstree", function(event) {
            event.preventDefault();

            var node = $(event.target).closest("li>a");
            
            // 선택한 데이터베이스의 값을 가져온다
            let selectedDb_s = `#${node[0].id}`;

            // 노드 레벨이 1레벨이면
            if ( selectedDb_s.includes(`_lvl01_anchor`) ) {
                if (objThis.selectedDb_s != '') {                           // 이전에 선택된 데이터베이스 값이 있으면
                    $(objThis.selectedDb_s).css("font-weight", "normal");   // 글씨 굵기를 원래대로   바꾼다
                    $(objThis.selectedDb_s).css("color", "black");          // 글씨 색깔을 검정색으로 바꾼다
                }

                // 방금 선택된 데이터베이스 아이템의
                $(selectedDb_s).css("font-weight", "bold");                 // 글씨 굵기를 진하게     바꾼다
                $(selectedDb_s).css("color", "blue");                       // 글씨 색깔을 파란색으로 바꾼다
                
                $("#jt_db").jstree("close_all");                            // Tree 모든 항목 접기
                $("#jt_db").jstree("open_node", selectedDb_s);              // 선택된 데이터베이스 아이템 펼치기

                // 선택한 데이터베이스의 값을 this 에 저장한다.
                // (이전에 선택한 데이터베이스의 값을 알고자 사용하였다.)
                objThis.selectedDb_s = selectedDb_s;

                // 셀렉트박스 데이터베이스 값을 설정한다.
                $("#sb_db").val(node[0].id.replace(/\_lvl01_anchor/g,''));
            } else {
                return;
            }
         });
    }

    initSelectBoxEvt() {

    }

    initTreeEvt() {

    }

    /**
     * 파일 정보 읽어오기
     * 
     * @param {*} file 
     */
    readToFile(file){
        var reader = new FileReader();
        reader.onload = function () {
            $("#sql").val(reader.result);
        };
        reader.readAsText(file, /* optional */ "euc-kr");
    }

    /**
     * 파일 저장하기
     */
    saveToFile(filename, content, window) {
        var blob = new Blob([content], { type: 'text/plain' });
        let objURL = window.URL.createObjectURL(blob);
                
        // 이전에 생성된 메모리 해제
        if (window.__Xr_objURL_forCreatingFile__) {
            window.URL.revokeObjectURL(window.__Xr_objURL_forCreatingFile__);
        }
        window.__Xr_objURL_forCreatingFile__ = objURL;
        var a = document.createElement('a');
        a.download = filename;
        a.href = objURL;
        a.click();
    }
        
    /**
     * 콜백함수 : 실행 버튼 클릭 이벤트
     * 
     * @param {*} req_o 요청 오브젝트
     * @param {*} res_o 응답 오브젝트
     */
    cbRun(req_o, res_o, this_o){
        // 신규 컬럼 추가
        for (let y=0; y<res_o.result.head.length; y++){
            w2ui['list'].addColumn({ field: res_o.result.head[y], caption: res_o.result.head[y], size: '120px', sortable:true });
            this_o.header_a[y] = res_o.result.head[y];
        }
        w2ui['list'].refresh();

        // 데이터 추가
        w2ui['list'].add(res_o.result.data);
        w2ui['list'].refresh();
    }

    /**
     * 최초 조회
     */
    selectList(){

    }

}
