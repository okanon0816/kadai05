// 作りたいもの：
// slackに投稿された内容をジャンルごとに保存できるアプリ

// 😏マストでやりたい
// １．ジャンル別にfirebaseに保存＆表示(ラジオボタンでジャンル選択)
//  ▶全部取得して、選択したラジオボタンによって表示を変える
// ２．既存設定されているジャンルだけでなく、自分でジャンルを追加できるようにしたい
//  ▶ユーザーがジャンルを自由に記載すると挙動が制御できないのでこちらで複数用意しておく

// 🙄時間があればやりたい
// １．Googleアカウントで認証を使って自分だけのslack保存ページにしたい
// ２．リンクのある投稿はマウスをホバーすると当該ページのサムネが見られるようにしたい
// ３．個別の削除機能
// ４．レスポンシブ対応

//以下firebase

// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.1.0/firebase-app.js";

// 貼り付ける場所
import {
  getDatabase,
  ref,
  push,
  set,
  onChildAdded,
  remove,
  onChildRemoved,
  serverTimestamp,
  onValue,
  query,
  orderByChild,
} from "https://www.gstatic.com/firebasejs/9.1.0/firebase-database.js";
//
import { getAuth, signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.1.0/firebase-auth.js";

  // TODO: Add SDKs for Firebase products that you want to use
  // https://firebase.google.com/docs/web/setup#available-libraries

  // Your web app's Firebase configuration
    //APIキーはここ

  // Initialize Firebase
  const app = initializeApp(firebaseConfig);

  const db = getDatabase(app);//FireBaseのおまじない。FB使いたいならこれ書く！
  const dbRef = ref(db,'kadai05/');//右はプロジェクト名

// ##################################
// GoogleAuth(認証用)
// ##################################
const provider = new GoogleAuthProvider();
provider.addScope("https://www.googleapis.com/auth/contacts.readonly");
const auth = getAuth();

//loginしていれば処理
onAuthStateChanged(auth, (user) => {
    if(user) {
        const uid = user.uid;
        console.log(uid,'uid');
        if(user !== null) {
            user.providerData.forEach((profile) => {
                const uname = profile.displayName;
                const authValue = `
                これは${uname}さんのslackメモ
                `
                $("#uname").text(authValue);
                // $("#prof").attr("src",profile.photoURL);
                console.log("");
                // console.log("Sign-in provider:" + profile.providerId);
                // console.log("Provider-specific UID:" + profile.uid);
                // console.log("Email:" + profile.email);
                // console.log("Photo URL:" + profile.photoURL);
            })
        }
    
    // 送信処理を記述
    $("#send").on("click", function () {
    
        // console.log(uname, 'データの取得の仕方で表示が異なるのをチェックしましょう🤗')
    
        // id="text" の場所を取得します🤗
        const text = $("#text").val();
        // console.log(text,'text'); //確認済

        //テキストエリアが空、空白、改行のみの場合にalertを出す
        //https://qiita.com/marukome/items/e41b3b39dbbf3f4dd0ab
        if (text === "" || !text.match(/\S/g)) {
            alert('文字入力して🙄');
            return false;
        }
    
        // ジャンルの取得(クリックされてるラジオボタンのvalueを取得)
        const type =  $('input:radio[name="radio"]:checked').val();
        // console.log(type, "ss"); //確認済

        //ラジオボタンが何も押されてなかったらalertを出す
        //https://oshiete.goo.ne.jp/qa/692093.html
        if((document.form1.radio[0].checked==false) &&
            (document.form1.radio[1].checked==false) &&
            (document.form1.radio[2].checked==false) &&
            (document.form1.radio[3].checked==false)) {
            alert("ジャンル選択して🥺")
            return false;
        }
    
        const msg = {
        type: type,
        text: text,
        date: serverTimestamp(), //これがポイント！
        };
    
        // firebaseに送る準備をしていることになります🤗
        const dbRef = ref(db,'kadai05/'+uid);//右はプロジェクト名
        const newPostRef = push(dbRef); //データを送信できる準備
        set(newPostRef, msg); // firebaseの登録できる場所に保存するイメージです🤗
    
        // 送信後に、入力欄を空にしましょう🤗
        $("#text").val("");
    
        // これを使うとどうなるかみてみましょう🤗
        $("#text").focus();
    
        // send送信イベント この下消さない
    });
    
    //これでデータを取得し、その中でonChildAddedを使って処理をする
    onValue(dbRef, function (data) {
        const d = data.val();
        // console.log(d, "firebaseのデータ"); //確認済
        const v = query(ref(db, `kadai05/`+uid), orderByChild("date"));
        // console.log(v); //debug
        // 配列とonChildAddedを用いて、dateが小きい順の配列を作る
        let arrDate = []; //dateが大きい順に格納するローカル変数を宣言
    
        onChildAdded(v, function (data) {
        //   console.log(data.val());
        //   console.log(data.key,'data.key');
        const hash = {
            key: data.key,
            type: data.val().type,
            text: data.val().text,
            date: data.val().date,
        };
        arrDate.unshift(hash); //unshiftで配列の先頭に追加する
        //   console.log(arrDate, "sss");
        });
    
        // filterというおまじないを使って、typeがclassのやつだけをピックアップ
        let class_ = arrDate //classはstrictモードだと予約語になるので_等をつけて予約語じゃなくする
        .filter((item) => item.type === "class")
        .map((item, index) => {
            const d = new Date(item.date);
            let year = d.getFullYear();
            let month = d.getMonth() + 1;
            let day = d.getDate(); //ここ間違ってました！
            let hour = d.getHours();
            let min = d.getMinutes();
            let ret = ( '00' + min ).slice( -2 ); //分が1桁の時、前に0をつける
            
            //文字列内のURLを自動でリンクに変換
            //https://bnsgt.hatenablog.com/entry/2020/05/03/134444
            var str = item.text
            // console.log(str,'str');
            var regexp_url = /((h?)(ttps?:\/\/[a-zA-Z0-9.\-_@:/~?%&;=+#',()*!]+))/g; // ']))/;正規表現（/〜/）を解釈してくれないエディタ等で自動整形を崩さないため。
            var regexp_makeLink = function(all, url, h, href) {
            return '<a href="h' + href + '" target="_blank">' + url + '</a>';
            }
            var textWithLink = str.replace(regexp_url, regexp_makeLink);
            // console.log(textWithLink,'textWithLink');
            // console.log(item.key);

            let h = `
            <span class="msg" data-date=${item.key}>
            <li class="link">${textWithLink}<i class="fa-regular fa-trash-can fa-lg" id="delete" name='${item.key}'></i></li>
            <span class="day">${year}/${month}/${day} ${hour}:${ret}</span>
            </span>
        `;
            return h;
        });
        $("#output1").html(class_);
    
        // filterというおまじないを使って、typeがtipsのやつだけをピックアップ
        let tips = arrDate
        .filter((item) => item.type === "tips")
        .map((item, index) => {
            const d = new Date(item.date);
            let year = d.getFullYear();
            let month = d.getMonth() + 1;
            let day = d.getDate(); //ここ間違ってました！
            let hour = d.getHours();
            let min = d.getMinutes();
            let ret = ( '00' + min ).slice( -2 ); //分が1桁の時、前に0をつける

            //文字列内のURLを自動でリンクに変換
            //https://bnsgt.hatenablog.com/entry/2020/05/03/134444
            var str = item.text
            // console.log(str,'str');
            var regexp_url = /((h?)(ttps?:\/\/[a-zA-Z0-9.\-_@:/~?%&;=+#',()*!]+))/g; // ']))/;正規表現（/〜/）を解釈してくれないエディタ等で自動整形を崩さないため。
            var regexp_makeLink = function(all, url, h, href) {
            return '<a href="h' + href + '" target="_blank">' + url + '</a>';
            }
            var textWithLink = str.replace(regexp_url, regexp_makeLink);
            // console.log(textWithLink,'textWithLink');

            let h = `
            <span class="msg" data-date=${item.key}>
            <li>${textWithLink}<i class="fa-regular fa-trash-can fa-lg" id="delete" name='${item.key}'></i></li>
            <span class="day">${year}/${month}/${day} ${hour}:${ret}</span>
            </span>
        `;
            return h;
        });

        $("#output2").html(tips);
    
        // filterというおまじないを使って、typeがideaのやつだけをピックアップ
        let idea = arrDate
        .filter((item) => item.type === "idea")
        .map((item, index) => {
            const d = new Date(item.date);
            let year = d.getFullYear();
            let month = d.getMonth() + 1;
            let day = d.getDate();
            let hour = d.getHours();
            let min = d.getMinutes();
            let ret = ( '00' + min ).slice( -2 );

            //文字列内のURLを自動でリンクに変換
            //https://bnsgt.hatenablog.com/entry/2020/05/03/134444
            var str = item.text
            // console.log(str,'str');
            var regexp_url = /((h?)(ttps?:\/\/[a-zA-Z0-9.\-_@:/~?%&;=+#',()*!]+))/g; // ']))/;正規表現（/〜/）を解釈してくれないエディタ等で自動整形を崩さないため。
            var regexp_makeLink = function(all, url, h, href) {
            return '<a href="h' + href + '" target="_blank">' + url + '</a>';
            }
            var textWithLink = str.replace(regexp_url, regexp_makeLink);
            // console.log(textWithLink,'textWithLink');

            let h = `
            <span class="msg" data-date=${item.key}>
            <li>${textWithLink}<i class="fa-regular fa-trash-can fa-lg" id="delete" name='${item.key}'></i></li>
            <span class="day">${year}/${month}/${day} ${hour}:${ret}</span>
            </span>
        `;
            return h;
        });
        $("#output3").html(idea);

        let others = arrDate
        .filter((item) => item.type === "others")
        .map((item, index) => {
        const d = new Date(item.date);
        let year = d.getFullYear();
        let month = d.getMonth() + 1;
        let day = d.getDate();
        let hour = d.getHours();
        let min = d.getMinutes();
        let ret = ( '00' + min ).slice( -2 ); //分が1桁の時、前に0をつける

            //文字列内のURLを自動でリンクに変換
            //https://bnsgt.hatenablog.com/entry/2020/05/03/134444
            var str = item.text
            // console.log(str,'str');
            var regexp_url = /((h?)(ttps?:\/\/[a-zA-Z0-9.\-_@:/~?%&;=+#',()*!]+))/g; // ']))/;正規表現（/〜/）を解釈してくれないエディタ等で自動整形を崩さないため。
            var regexp_makeLink = function(all, url, h, href) {
            return '<a href="h' + href + '" target="_blank">' + url + '</a>';
            }
            var textWithLink = str.replace(regexp_url, regexp_makeLink);
            // console.log(textWithLink,'textWithLink');

        let h = `
        <span class="msg" data-date=${item.key}>
            <li>${textWithLink}<i class="fa-regular fa-trash-can fa-lg" id="delete" name='${item.key}'></i></li>
            <span class="day">${year}/${month}/${day} ${hour}:${ret}</span>
        </span>
        `;
        return h;
        });
    $("#output4").html(others);

    });
    
    //削除ボタンを押したとき
    $(document).on("click", "#delete", function () {;
        console.log('aaa');

        // buttonのnameを取得してdbのリファレンスを削除します。
        let target = $(this).attr("name");
        console.log(target,'target');
        remove(ref(db, `kadai05/${uid}/` + target));

        // 画面を更新して反映させます。
        location.reload();
        
    });

　} else {
    _redirect();
}
});  //loginしたら処理の閉じカッコ

//login画面へのリダイレクト関数
function _redirect(){
    location.href = "login.html";
}

//logout処理
$('#out').on('click', function(){
    signOut(auth).then(() => {
        _redirect();
    }).catch((error) => {
        console.error(error);
    });
});
