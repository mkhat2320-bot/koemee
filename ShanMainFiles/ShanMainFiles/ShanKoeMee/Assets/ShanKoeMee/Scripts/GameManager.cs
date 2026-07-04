using System;
using System.Collections;
using System.Collections.Generic;
using System.IO;
using System.Net;
using SimpleJSON;
using UnityEngine;
using UnityEngine.SceneManagement;
using UnityEngine.UI;
using Random = UnityEngine.Random;
using System.Collections.Generic;
using UnityEngine.EventSystems;
using UnityEngine.Networking;
using UnitySocketIO;
using UnitySocketIO.Events;

public class GameManager : MonoBehaviour {
    //Socket.io
    public SocketIOController socket;
    private int mplt = 6;
    public GameObject[] player;
    public GameObject[] playerHalf;
    public GameObject[] playerCircleRotate;
    public GameObject[] playerMask;
    public GameObject[] playerTopSpr;
    public GameObject[] chatBack;
    public Text[] playerAmountTxt;
    public Text[] playerNameTxt;
    public Text[] playerStatusTxt;
    public Text[] playerWinStatusTxt;
    public Text[] playerX2StatusTxt;
    public Text instructionTxt;
    public GameObject[] playerCardPos;
    public GameObject[] playerCardViewPos;
    private List<string> tableGameList;
    private List<string> spinGameList;
    private List<string> slotGameList;
    private List<string> diceGameList;
    private List<string> fishingGameList;
    private List<string> shanLevelList;
    private List<string> shanLevelDesList;
    private List<string> totalCards;
    private List<int> totalCards2;
    private List<int> valueCards;
    private bool cardStartPass;
    private GameObject[] cards;
    public bool[] playerEnable;
    public bool[] cardSeenChe;
    public static bool[] playerEnableChe;
    private bool[] cardPassed;
    private Vector3[] startPos;
    private Vector3[] endPos;
    private GameObject Dealerpoint;
    private float[] currentLerpTime;
    private int currentPlayValue;
    public GameObject YouPanel;
    public GameObject ChatPanel;
    private int you;

    public Camera cam;
    private int potValue;
    public Image _bar;
    public Image _Redbar;
    private bool barChe;
    private bool redBarChe;
    public float bar_value;
    public float redBar_value;
    private GameObject[] flipCards;
    public GameObject frontCardPrefab;
    public Sprite frontCardSprite;
    public GameObject animalPrefab;
    int sOrder2 = 0;
    public Sprite[] animalSprites;
    int sOrder = 0;
    public Button chaalBtn;
    public Button showBtn;
    public Button sideShowBtn;
    public Button seeBtn;
    public Button timeOutBtn;
    private int chaalIncrementValue;
    private int chaalIncrementValue2;
    private int seenValue;
    public GameObject winParticle;
    private GameObject winParticle2;
    public GameObject dealerSprite;
    private int[] winSequence = new int[5];
    private int[] winSequence2 = new int[5];
    private int[] winSequence3 = new int[5];
    public GameObject askSideShowBoard;
    public Text messageAskedSS;
    public GameObject timeOutPanel;
    public Text timeOutTxt;

    private List<float> passedCardRotateValue;
    private List<float> passedCardRotateValue2;
    private List<float> passedCardRotateValue3;

    public Button TryAgainBtn;
    private int currSideValue = 0;
    private int sideShowLossValue;
    private string winStr;
    private string winName;

    public Text startBootLimitTxt;
    public Text startBlindLimitTxt;
    public Text startChaalLimitTxt;
    public Text startBetLimitTxt;

    public GameObject sidePanelAnim;
    private int room;
    private int wait;

    public AudioSource buttonSound;
    public AudioSource dropSound;
    public AudioSource[] passSound;
    public AudioSource winSound;
    public AudioSource myturnSound;
    public AudioSource packSound;
    public InputField inputChat;
    public Text ChatMsgTxt;
    private float chatCount = 0;

    private int internetTextCount;
    public GameObject internetCheckPanel;
    public Text internetTxt;
    public GameObject InternetAlertPanel;
    private bool ConnectChe = true;

    //Bot Features
    private float botBootCount;
    private bool botBootChe;
    private bool bootStartChe = false;
    private bool startChe = false;
    private bool startCardChe = false;
    private bool playingChe = false;
    private int botCurrentPlayValue = 0;
    private int botDealerValue = 0;
    private float botTimerCount;
    private bool initCheFuncChe = true;

    private bool botShowChe = false;
    private bool botClickShowChe = false;

    public ScrollRect scrollView;
    public GameObject scrollContent;
    public GameObject scrollItemPrefab;
    public GameObject gameItemPrefab;
    public GameObject gameScrollContent;
    public GameObject shanLevelPrefab;
    public GameObject shanLevelScrollContent;

    private GameObject scrollItemObj;
    public GameObject lobbyPanel;

    public bool noChipsBotChe;
    private bool clickTableChe = true;
    public GameObject loginScreen;
    public GameObject loginWindow;
    private string prefsUsername;
    private string prefsPassword;
    public InputField loginUsernameField;
    public InputField loginPasswordField;
    public Toggle rememberMeToggle;
    public GameObject loadingScreen;
    private float loadingCount;
    public Image loadingImg;
    public GameObject alertPanel;
    private bool loadingChe = false;

    public Text totalPlayerTxt;
    public Text activePlayersTxt;
    public Text selectedLobbyTxt;
    public GameObject[] playerSelectBtn;
    public int seatPosition;
    private bool selectSeatChe = false;
    private string goBtnName;

    private List<string> lobbiesArr = new List<string> ();
    List<GameObject> lobbiesObjects = new List<GameObject> ();
    List<GameObject> shanLevelObjects = new List<GameObject> ();
    List<GameObject> gameObjects = new List<GameObject> ();
    private float serverConnectingCount;
    private float serverConnectingCount2;
    private bool serverConnectChe = false;
    public Text tableTypeTxt;
    public GameObject GameSettingObj;
    public GameObject soundPanelObj;
    public GameObject themePanelObj;
    public GameObject playerSetUpPanel;
    //sound toggle
    public Toggle muteAllToggle;
    public Toggle cardShuffleToggle;
    public Toggle yourTurnToggle;
    public Toggle chipMoveToggle;
    public Toggle playerBetToggle;
    public Toggle playerRaiseToggle;
    public Toggle playerPackToggle;
    public GameObject withdrawPanel;
    public GameObject withdrawAvailablePanel;
    public GameObject withdrawNotAvailablePanel;
    public Text availableCashTxt;
    public Text withDrawStatusTxt;
    public Text withDrawStatusTxt2;
    public InputField withdrawField;
    public InputField BankNameField;
    public InputField AccountNumberField;
    public InputField IFSCCodeField;
    public InputField paytmNumberField;
    public InputField checkNameField;
    public InputField checkFatherNameField;
    public InputField checkAddressField;
    public GameObject withdrawMsg;
    public GameObject withdrawPanel2;
    public GameObject[] table;
    //select players
    public Toggle player8Toggle;
    public Toggle player6Toggle;
    public Toggle player4Toggle;
    public Toggle player2Toggle;
    public Toggle eyeToggle;
    private int standby;
    public GameObject purchasePanel;
    public GameObject registerPanel;
    public InputField regNameField;
    public InputField regUsernameField;
    public InputField regEmailField;
    public InputField regMobileField;
    public InputField regPasswordField;
    public Text statusTxt;
    public GameObject mobileVerifyPanel;
    public GameObject mobileVerifyMainPanel;
    public Text phoneNumberTxt;
    public GameObject otpPanel;

    public InputField changeNumberField;
    public Text changeNumberStatusTxt;
    public Text verifyPhoneTxt;
    public GameObject playPanel;
    public GameObject webViewObj;
    public GameObject rulesPanel;
    public GameObject MenuList;

    public GameObject InviteFriendsPanel;
    public Text inviteCodeTxt;
    public GameObject withBankObj;
    public GameObject withPaytmObj;
    public GameObject withCheckObj;
    private int withdrawSectionValue = 0;
    private string paymentMethodStr;
    public GameObject privateTablePanel;
    public GameObject privateTablePanel2;
    public GameObject privateCreatePanel;
    public InputField privateBootField;
    public InputField privateMaxBlindField;
    public Dropdown privateTableTypeDropdown;
    public Text privateStatusTxt;
    public GameObject PrivateSuccessPanel;
    public Text privateSuccessTxt;
    public Text privateTablePriceTxt;
    public InputField roomIdField;
    public Text enterBootTxt;
    public Text enterMaxBlindTxt;
    public Text enterTableTypeTxt;
    public GameObject joinPlayPanel;
    public string privateStr;
    private int findRoom;
    public GameObject testImg;

    public GameObject topGameName;
    public GameObject topBackBtn;
    public Text topGameNameTxt;
    public GameObject logoutPanel;
    private bool loginScreenEnable = false;
    public Image[] gameSprites;
    public Button[] topGameBtn;
    public Text inGamePlayerNameTxt;
    public Text inGamePlayerChipsTxt;
    public Text inGameTableNameTxt;
    public Text inGamePlayerInTxt;
    public Text inGameBankerInTxt;
    private int levelLoadingCount;
    public Text menuNameTxt;
    public Text menuChipsTxt;
    private bool serverExitChe = false;
    public GameObject splashScreen;

    public Toggle[] menuToggleBtn;
    private bool checkLoginChe = true;

    public GameObject playerAmtPanel;
    public Text MinText;
    public Text MaxText;
    public Text slideValueText;
    public Slider sliderMaxChips;
    public Toggle selectAutoPlayerAmount;
    public GameObject bankerObj;
    private bool[] otherEnableChe;
    private bool betTimerChe = false;
    public Image[] bar;
    public Text youPanelMinTxt;
    public Text youPanelMaxTxt;
    public Text youPanelSliderTxt;
    public Slider youPanelSlider;
    public Text[] playerBetTxt;
    public GameObject[] playerBetSprite;
    public bool findOtherPlayerChe = false;
    private float findPlayerCount;
    public GameObject swipePanel;
    public Image[] showCards;
    private Vector2 frontSwipePos;
    private Vector2 lastPosition;
    public GameObject playerHoldBtn;
    public GameObject playerDrawBtn;
    public GameObject playerDoneBtn;
    public GameObject playerAllBtn;
    public GameObject playerCardsBtn;
    public GameObject playerThreeCardBtn;
    private int numberOfCards;
    private string previousStr;
    public Image winSprite;
    public Image plainSprite;
    public Image normalSprite;

    public GameObject seatOccupiedPanel;
    private bool rotatingChe = false;
    private float rotatingCount;
    public Text loacalTxt;
    public GameObject balanceNotAvailable;
    public int playedSeat = -1;
    public GameObject waitingTimeObj;
    public Text[] chatTxt;
    public GameObject[] scoreValueBack;
    public Text[] scoreValueTxt;
    public GameObject ChatBtn;
    public bool inGameChe = false;
    private System.DateTime previousTime = System.DateTime.Now;
    private System.TimeSpan tsSub;
    private bool reconnectChe = false;
    private bool startConnectChe = false;

    void Start () {
        Screen.fullScreen = true;
        Screen.sleepTimeout = SleepTimeout.NeverSleep;
        splashScreen.gameObject.SetActive (true);
        loginScreenEnable = true;
        Screen.orientation = ScreenOrientation.LandscapeLeft;
        if (StartingValues.pokerBackStr == "yes") {
            loginScreen.gameObject.SetActive (false);
            loginScreenEnable = false;
            playPanel.gameObject.SetActive (true);
        }

        socket.On ("connect", (SocketIOEvent e) => {
            //previousTime = System.DateTime.Now;
            //print("welle ");

        });
        socket.Connect ();
        socket.On ("Server_Started", (SocketIOEvent e) => {
            OnUserConnected (e.data.ToString ());
        });
        socket.On ("VerifyUser", (SocketIOEvent e) => {
            OnVerifyUserConnected (e.data.ToString ());
        });
        socket.On ("RoomConnected", (SocketIOEvent e) => {
            OnRoomConnected (e.data.ToString ());
        });
        socket.On ("PlayerJoin", (SocketIOEvent e) => {
            OnPlayerJoinConnected (e.data.ToString ());
        });
        socket.On ("PlayerWatch", (SocketIOEvent e) => {
            OnPlayerWatchConnected (e.data.ToString ());
        });
        socket.On ("Settings", (SocketIOEvent e) => {
            OnSettingsConnected (e.data.ToString ());
        });
        socket.On ("RemoveBanker", (SocketIOEvent e) => {
            OnRemoveBankerConnected (e.data.ToString ());
        });

        socket.On ("PlyingUser", (SocketIOEvent e) => {
            OnPlyingUserConnected (e.data.ToString ());
        });
        socket.On ("GetGameList", (SocketIOEvent e) => {
            OnGetGameListConnected (e.data.ToString ());
        });
        socket.On ("GetShan", (SocketIOEvent e) => {
            OnGetShanConnected (e.data.ToString ());
        });
        socket.On ("announcement", (SocketIOEvent e) => {
            OnAnnouncementConnected (e.data.ToString ());
        });
        socket.On ("BET", (SocketIOEvent e) => {
            OnBetConnected (e.data.ToString ());
        });
        socket.On ("ResetGame", (SocketIOEvent e) => {
            OnResetGameConnected (e.data.ToString ());
        });
        socket.On ("RemovePlayer", (SocketIOEvent e) => {
            OnRemovePlayerConnected (e.data.ToString ());
        });
        socket.On ("PlusBtn", (SocketIOEvent e) => {
            OnPlusBtnConnected (e.data.ToString ());
        });
        socket.On ("CreateTable", (SocketIOEvent e) => {
            OnCreateTableConnected (e.data.ToString ());
        });
        socket.On ("JoinPrivateRoom", (SocketIOEvent e) => {
            OnJoinPrivateRoomConnected (e.data.ToString ());
        });
        socket.On ("YOU", (SocketIOEvent e) => {
            OnYouConnected (e.data.ToString ());
        });
        socket.On ("GameStartIn", (SocketIOEvent e) => {
            OnGameStartInConnected (e.data.ToString ());
        });
        socket.On ("GameStartTimer", (SocketIOEvent e) => {
            OnGameStartTimerConnected (e.data.ToString ());
        });
        socket.On ("StartTimer", (SocketIOEvent e) => {
            OnStartTimerConnected (e.data.ToString ());
        });
        socket.On ("Start_CardPass", (SocketIOEvent e) => {
            OnStartCardPassConnected (e.data.ToString ());
        });
        socket.On ("StartShowCard", (SocketIOEvent e) => {
            OnStartShowCardConnected (e.data.ToString ());
        });
        socket.On ("StartShowCard2", (SocketIOEvent e) => {
            OnStartShowCard2Connected (e.data.ToString ());
        });
        socket.On ("EndShowCard", (SocketIOEvent e) => {
            OnEndShowCardConnected (e.data.ToString ());
        });
        socket.On ("EndShowCard2", (SocketIOEvent e) => {
            OnEndShowCard2Connected (e.data.ToString ());
        });
        socket.On ("WinResult", (SocketIOEvent e) => {
            OnWinResultConnected (e.data.ToString ());
        });
        socket.On ("WinResult2", (SocketIOEvent e) => {
            OnWinResult2Connected (e.data.ToString ());
        });
        socket.On ("BetUpdate", (SocketIOEvent e) => {
            OnBetUpdateConnected (e.data.ToString ());
        });
        socket.On ("SeatFull", (SocketIOEvent e) => {
            OnSeatFullConnected (e.data.ToString ());
        });
        socket.On ("UpdateChips", (SocketIOEvent e) => {
            OnUpdateChipsConnected (e.data.ToString ());
        });
        socket.On ("UpdateBanker", (SocketIOEvent e) => {
            OnUpdateBankerConnected (e.data.ToString ());
        });
        socket.On ("GetChips", (SocketIOEvent e) => {
            OnGetChipsConnected (e.data.ToString ());
        });
        socket.On ("AUTO", (SocketIOEvent e) => {
            OnAutoConnected (e.data.ToString ());
        });
        socket.On ("MESSAGE", (SocketIOEvent e) => {
            OnMESSAGEConnected (e.data.ToString ());
        });
        socket.On ("BalanceNot", (SocketIOEvent e) => {
            OnBalanceNotConnected (e.data.ToString ());
        });
        socket.On ("BackBtn", (SocketIOEvent e) => {
            OnBackBtnConnected (e.data.ToString ());
        });

        socket.On ("WARNING", (SocketIOEvent e) => {
            OnWARNINGConnected (e.data.ToString ());
        });
        socket.On ("ExitUpdateCash", (SocketIOEvent e) => {
            OnExitUpdateCashConnected (e.data.ToString ());
        });
        socket.On ("SocketActive", (SocketIOEvent e) => {
            OnSocketActiveConnected (e.data.ToString ());
        });
        socket.On ("CHAT", (SocketIOEvent e) => {
            OnCHATConnected (e.data.ToString ());
        });
        socket.On ("ContinueSockets", (SocketIOEvent e) => {
            OnContinueSocketsConnected (e.data.ToString ());
        });

        prefsUsername = PlayerPrefs.GetString ("username");
        prefsPassword = PlayerPrefs.GetString ("password");

        loginUsernameField.text = prefsUsername;
        loginPasswordField.text = prefsPassword;
        tableGameList = new List<string> {
            "Shan Koe Mee",
        };
        /* tableGameList = new List<string> {
            "Shan (Banker)",
            "Shan (Center)",
            "Bugyi (Banker)",
            "Bugyi (Center)",
            "Blackjack (Banker)",
            "Blackjack (Center)",
            "Baccarat",
            "Poker"
        };*/
        spinGameList = new List<string> {
            "Spin",
        };
        slotGameList = new List<string> {
            "Slot",
        };
        diceGameList = new List<string> {
            "Dice",
        };
        fishingGameList = new List<string> {
            "Fishing",
        };
        shanLevelList = new List<string> {
            "LEVEL ONE",
            "LEVEL TWO",
            "LEVEL THREE",
            "LEVEL FOUR",
            "LEVEL FIVE",
            "LEVEL SIX"
        };
        shanLevelDesList = new List<string> {
            "1K TO 10K",
            "10K TO 100K",
            "100K TO 1M",
            "1M TO 10M",
            "10M TO 100M",
            "100M TO 1B"
        };
        valueCards = new List<int> {
            1,
            10,
            10,
            10,
            10,
            9,
            8,
            7,
            6,
            5,
            4,
            3,
            2,
            1,
            10,
            10,
            10,
            10,
            9,
            8,
            7,
            6,
            5,
            4,
            3,
            2,
            1,
            10,
            10,
            10,
            10,
            9,
            8,
            7,
            6,
            5,
            4,
            3,
            2,
            1,
            10,
            10,
            10,
            10,
            9,
            8,
            7,
            6,
            5,
            4,
            3,
            2
        };

        totalCards = new List<string> {
            "Ac",
            "Kc",
            "Qc",
            "Jc",
            "Tc",
            "9c",
            "8c",
            "7c",
            "6c",
            "5c",
            "4c",
            "3c",
            "2c",
            "Ad",
            "Kd",
            "Qd",
            "Jd",
            "Td",
            "9d",
            "8d",
            "7d",
            "6d",
            "5d",
            "4d",
            "3d",
            "2d",
            "Ah",
            "Kh",
            "Qh",
            "Jh",
            "Th",
            "9h",
            "8h",
            "7h",
            "6h",
            "5h",
            "4h",
            "3h",
            "2h",
            "As",
            "Ks",
            "Qs",
            "Js",
            "Ts",
            "9s",
            "8s",
            "7s",
            "6s",
            "5s",
            "4s",
            "3s",
            "2s"
        };

        totalCards2 = new List<int> {
            0,
            1,
            2,
            3,
            4,
            5,
            6,
            7,
            8,
            9,
            10,
            11,
            12,
            13,
            14,
            15,
            16,
            17,
            18,
            19,
            20,
            21,
            22,
            23,
            24,
            25,
            26,
            27,
            28,
            29,
            30,
            31,
            32,
            33,
            34,
            35,
            36,
            37,
            38,
            39,
            40,
            41,
            42,
            43,
            44,
            45,
            46,
            47,
            48,
            49,
            50,
            51,
        };

        passedCardRotateValue = new List<float> {
            17,
            17,
            17,
            17,
            17,
            17,

            0,
            0,
            0,
            0,
            0,
            0,

            -17,
            -17,
            -17,
            -17,
            -17,
            -17,

        };
        passedCardRotateValue2 = new List<float> {-0.2f,
            -0.2f,
            -0.2f,
            -0.2f,
            -0.2f,
            -0.2f,
            0.8f,
            0.8f,
            0.8f,
            0.8f,
            0.8f,
            0.8f,
            0.2f,
            0.2f,
            0.2f,
            0.2f,
            0.2f,
            0.2f

        };
        passedCardRotateValue3 = new List<float> {
            0.1f,
            0.1f,
            0.1f,
            0.1f,
            0.1f,
            0.1f,

            0.1f,
            0.1f,
            0.1f,
            0.1f,
            0.1f,
            0.1f,

            0.1f,
            0.1f,
            0.1f,
            0.1f,
            0.1f,
            0.1f,

        };
        otherEnableChe = new bool[6];
        for (int i = 0; i < 6; i++) {
            otherEnableChe[i] = false;
        }
        frontSwipePos = showCards[0].transform.position;

        playerEnable = new bool[mplt];
        playerEnableChe = new bool[mplt * 3];
        cardPassed = new bool[mplt * 3];
        startPos = new Vector3[mplt * 3];
        endPos = new Vector3[mplt * 3];
        currentLerpTime = new float[mplt * 3];
        cards = new GameObject[mplt * 3];
        flipCards = new GameObject[mplt * 3];
        cardSeenChe = new bool[mplt];

        for (int i = 0; i < mplt; i++) {
            cardSeenChe[i] = false;
        }
        Dealerpoint = GameObject.Find ("DealerPoint");
        for (int i = 0; i < mplt * 3; i++) {
            playerEnableChe[i] = false;
            cardPassed[i] = true;
        }
        for (int i = 0; i < mplt; i++) {
            player[i].gameObject.SetActive (false);
            playerHalf[i].gameObject.SetActive (false);
            playerBetSprite[i].gameObject.SetActive (false);
            // playerMask[i].gameObject.SetActive (false);
            //playerTopSpr[i].gameObject.SetActive (false);
            playerAmountTxt[i].gameObject.SetActive (false);
            playerNameTxt[i].gameObject.SetActive (false);
            playerCircleRotate[i].gameObject.SetActive (false);
            playerCircleRotate[i].transform.position = player[i].transform.position;
            chatBack[i].gameObject.SetActive (false);
        }
        bankerObj.gameObject.SetActive (false);

        updatePlayerPos ();

        for (int i = 0; i < 6; i++) {
            Vector3 vec = new Vector3 (player[i].transform.position.x, player[i].transform.position.y, player[i].transform.position.z);
            Vector3 screenPos = cam.WorldToScreenPoint (vec);
            playerSelectBtn[i].transform.position = new Vector3 (screenPos.x, screenPos.y, screenPos.z);
        }

        Vector3 vec6 = new Vector3 (Dealerpoint.transform.position.x, Dealerpoint.transform.position.y - 2.0f, Dealerpoint.transform.position.z);
        Vector3 screenPos6 = cam.WorldToScreenPoint (vec6);
        instructionTxt.transform.position = new Vector3 (screenPos6.x, screenPos6.y, screenPos6.z);

        vec6 = new Vector3 (Dealerpoint.transform.position.x, Dealerpoint.transform.position.y - 1.5f, Dealerpoint.transform.position.z);
        screenPos6 = cam.WorldToScreenPoint (vec6);
        ChatMsgTxt.transform.position = new Vector3 (screenPos6.x, screenPos6.y, screenPos6.z);

        TryAgainBtn.gameObject.SetActive (false);
        dealerSprite.gameObject.SetActive (false);
        showBtn.gameObject.SetActive (false);
        sideShowBtn.gameObject.SetActive (false);
        askSideShowBoard.gameObject.SetActive (false);
        seeBtn.gameObject.SetActive (false);
        ChatMsgTxt.gameObject.SetActive (false);
        changeTable ();
        setPlayerToggle ();

    }

    public void changeTable () {
        int sTheme = PlayerPrefs.GetInt ("SelectTheme");
        if (sTheme == 0 || sTheme == 1) {
            table[0].gameObject.SetActive (true);
            table[1].gameObject.SetActive (false);
            table[2].gameObject.SetActive (false);
        } else if (sTheme == 2) {
            table[0].gameObject.SetActive (false);
            table[1].gameObject.SetActive (true);
            table[2].gameObject.SetActive (false);
        } else if (sTheme == 3) {
            table[0].gameObject.SetActive (false);
            table[1].gameObject.SetActive (false);
            table[2].gameObject.SetActive (true);
        }
    }
    private void updatePlayerPos () {
        for (int i = 0; i < mplt; i++) {
            //player[i].transform.position = playerCardPos[i].transform.position;
            //playerMask[i].transform.position = playerCardPos[i].transform.position;
            // playerTopSpr[i].transform.position = playerCardPos[i].transform.position;
        }
        float angle = Mathf.MoveTowardsAngle (transform.eulerAngles.y, 270, 1.0f);
        float angle2 = Mathf.MoveTowardsAngle (transform.eulerAngles.y, 270, -1.2f);
        float angle3 = Mathf.MoveTowardsAngle (transform.eulerAngles.y, 270, 0.5f);
        for (int i = 0; i < mplt; i++) {
            Vector3 vec;
            Vector3 screenPos;

            if (i <= 2)
                vec = new Vector3 (player[i].transform.position.x + 2.45f, player[i].transform.position.y + 0.25f, player[i].transform.position.z);
            else
                vec = new Vector3 (player[i].transform.position.x - 2.45f, player[i].transform.position.y + 0.25f, player[i].transform.position.z);
            screenPos = cam.WorldToScreenPoint (vec);
            playerAmountTxt[i].transform.position = new Vector3 (screenPos.x, screenPos.y, screenPos.z);

            if (i <= 2)
                vec = new Vector3 (player[i].transform.position.x + 2.45f, player[i].transform.position.y - 0.17f, player[i].transform.position.z);
            else
                vec = new Vector3 (player[i].transform.position.x - 2.45f, player[i].transform.position.y - 0.17f, player[i].transform.position.z);
            screenPos = cam.WorldToScreenPoint (vec);
            playerNameTxt[i].transform.position = new Vector3 (screenPos.x, screenPos.y, screenPos.z);

            Vector3 vec4 = new Vector3 (player[i].transform.position.x, player[i].transform.position.y - 0.4f, player[i].transform.position.z);
            Vector3 screenPos4 = cam.WorldToScreenPoint (vec4);
            playerStatusTxt[i].transform.position = new Vector3 (screenPos4.x, screenPos4.y, screenPos4.z);

            vec = new Vector3 (player[i].transform.position.x, player[i].transform.position.y, player[i].transform.position.z);
            screenPos = cam.WorldToScreenPoint (vec);
            playerWinStatusTxt[i].transform.position = screenPos;

            vec = new Vector3 (player[i].transform.position.x, player[i].transform.position.y - 0.8f, player[i].transform.position.z);
            screenPos = cam.WorldToScreenPoint (vec);
            playerX2StatusTxt[i].transform.position = screenPos;

            if (i <= 2)
                vec = new Vector3 (player[i].transform.position.x + 2.45f, player[i].transform.position.y + 0.05f, player[i].transform.position.z);
            else
                vec = new Vector3 (player[i].transform.position.x - 2.45f, player[i].transform.position.y + 0.05f, player[i].transform.position.z);
            screenPos = cam.WorldToScreenPoint (vec);
            bar[i].transform.position = screenPos;

            vec = new Vector3 (playerBetSprite[i].transform.position.x, playerBetSprite[i].transform.position.y, playerBetSprite[i].transform.position.z);
            screenPos = cam.WorldToScreenPoint (vec);
            playerBetTxt[i].transform.position = screenPos;

            vec = new Vector3 (player[i].transform.position.x, player[i].transform.position.y + 1.5f, player[i].transform.position.z);
            screenPos = cam.WorldToScreenPoint (vec);
            chatBack[i].transform.position = screenPos;

            vec = new Vector3 (scoreValueBack[i].transform.position.x, scoreValueBack[i].transform.position.y, scoreValueBack[i].transform.position.z);
            screenPos = cam.WorldToScreenPoint (vec);
            scoreValueTxt[i].transform.position = screenPos;

        }

        float angle4 = Mathf.MoveTowardsAngle (transform.eulerAngles.y, 270, 1.8f);
        Vector3 vec7 = new Vector3 (playerCardPos[you].transform.position.x, playerCardPos[you].transform.position.y - angle4, playerCardPos[you].transform.position.z);
        Vector3 screenPos7 = cam.WorldToScreenPoint (vec7);
        seeBtn.transform.position = new Vector3 (screenPos7.x, screenPos7.y, screenPos7.z);
    }
    // Update is called once per frame

    private string message = "";
    private float scrollSpeed = 70;
    private Rect messageRect;
    private GUIStyle guiStyle = new GUIStyle ();
    void OnGUI () {
        // Set up the message's rect if we haven't already

        if (loginScreenEnable) {
            if (messageRect.width == 0) {
                Vector2 dimensions = GUI.skin.label.CalcSize (new GUIContent (message));
                messageRect.width = dimensions.x;
                messageRect.height = dimensions.y;
                messageRect.x = (Screen.width / 1.5f) + dimensions.x;
                messageRect.y = Screen.height - 60;
            }
            messageRect.x -= Time.deltaTime * scrollSpeed;
            if (messageRect.x < -(messageRect.width * 2.5f))
                messageRect.x = Screen.width + messageRect.width;

            guiStyle.fontSize = 35;
            guiStyle.normal.textColor = Color.white;
            GUI.Label (messageRect, message, guiStyle);
        }
    }

    void Update () {

        if (cardStartPass)
            cardPassedFunc ();

        if (chatCount >= 1) {
            chatCount += Time.deltaTime * 10.7f;
            if (chatCount >= 25) {
                chatCount = 0;
                ChatMsgTxt.gameObject.SetActive (false);
                ChatMsgTxt.text = "";
            }
        }

        if (loadingChe) {
            Quaternion target2 = Quaternion.Euler (0, 0, loadingCount);
            loadingImg.transform.rotation = target2;
            loadingCount -= Time.deltaTime * 150.0f;
            //print(loadingCount);
            if (loadingCount < -300) {
                loadingScreen.gameObject.SetActive (false);
                loadingChe = false;
            }
        } else {
            loadingCount = 0;
        }

        if (rotatingChe) {
            Quaternion target2 = Quaternion.Euler (0, 0, rotatingCount);
            for (int i = 0; i < 6; i++)
                playerCircleRotate[i].transform.rotation = target2;
            rotatingCount -= Time.deltaTime * 150.0f;
        }

        if (!serverConnectChe) {
            serverConnectingCount += Time.deltaTime % 60;
            if (serverConnectingCount >= 3) {
                serverConnectingCount = 0;
                if (!reconnectChe)
                    socket.Connect ();
            }
        }
        serverConnectingCount2 += Time.deltaTime % 60;
        if (serverConnectingCount2 >= 2) {
            serverConnectingCount2 = 0;
            socket.Emit ("ContinueSockets");
            System.DateTime nowTime = System.DateTime.Now;
            System.TimeSpan ts1 = new System.TimeSpan (previousTime.Ticks);
            System.TimeSpan ts2 = new System.TimeSpan (nowTime.Ticks);
            tsSub = ts1.Subtract (ts2).Duration ();
            callContinueSockets ();
        }

        if (betTimerChe) {
            bar_value += Time.deltaTime * 30.7f;
            for (int i = 0; i < 6; i++) {
                if (otherEnableChe[i]) {
                    float amount = (bar_value / 100.0f) * 180.0f / 360;
                    bar[i].fillAmount = amount;
                }
            }
        }
        if (findOtherPlayerChe) {
            findPlayerCount += Time.deltaTime % 60;
            if (findPlayerCount >= 1) {
                findPlayerCount = 0;
                TestObject data = new TestObject ();
                data.room = room.ToString ();
                data.username = StartingValues.email;
                socket.Emit ("PlyingUser", JsonUtility.ToJson (data));
            }
        }

        if (Input.touchCount > 0) {
            Touch touch = Input.GetTouch (0);
            if (touch.phase == TouchPhase.Moved) {
                Vector2 pos = touch.position;
                //pos.x = (pos.x - width) / width;
                //pos.y = (pos.y - height) / height;
                //position = new Vector3(-pos.x, pos.y, 0.0f);
                //showCards[0].transform.position=pos;

                Vector2 currentMousePosition = touch.position;
                Vector2 diff = currentMousePosition - lastPosition;
                Vector3 newPosition = showCards[0].transform.position + new Vector3 (diff.x, diff.y, transform.position.z);
                showCards[0].transform.position = newPosition;
                lastPosition = currentMousePosition;

            }
            if (touch.phase == TouchPhase.Began) {
                Vector2 pos = touch.position;
                lastPosition = pos;
            }
            if (touch.phase == TouchPhase.Ended) {
                showCards[0].transform.position = frontSwipePos;
            }
        }
    }

    private void cardPassedFunc () {
        for (int i = 0; i < mplt * 3; i++) {
            int dValue = 0;
            if (i <= 5)
                dValue = i;
            else if (i > 5 && i <= 11)
                dValue = (i - 6);
            else if (i > 11)
                dValue = (i - 12);

            if (playerEnableChe[i]) {
                if (cardPassed[i]) {
                    if (i != dValue + 12)
                        passSound[i].Play ();
                    callFrontCardRender (i, dValue);
                }
                startPos[i] = Dealerpoint.transform.position;
                if (i == dValue || i == dValue + 6 || i == dValue + 12) {
                    float angle = Mathf.MoveTowardsAngle (transform.eulerAngles.y, 90, 0.6f);
                    if (i == dValue + 12)
                        cards[i].transform.localScale = new Vector3 (0f, 0f, 0f);
                    else
                        cards[i].transform.localScale = new Vector3 (1f, 1f, 1f);
                    endPos[i] = new Vector3 (player[dValue].transform.position.x, player[dValue].transform.position.y, player[dValue].transform.position.z);
                }

                currentLerpTime[i] += 0.25f;
                float Perc = currentLerpTime[i] / 1;
                if (cards[i] != null)
                    cards[i].transform.position = Vector3.Lerp (startPos[i], endPos[i], Perc);
                if (currentLerpTime[i] >= 1.5f) {
                    currentLerpTime[i] = 1;
                    checkPlayerEnableFunc (i, dValue);
                }
            }
        }
    }
    private void checkPlayerEnableFunc (int i, int dValue) {
        if (i >= 0) {
            float sValue = 0;
            if (dValue <= 2)
                sValue = 2.5f;
            else
                sValue = -2.5f;
            float px = (player[dValue].transform.position.x + Mathf.Cos (passedCardRotateValue2[i]) * passedCardRotateValue3[i]);
            float py = player[dValue].transform.position.y - 1.0f + Mathf.Sin (passedCardRotateValue2[i]) * passedCardRotateValue3[i];

            //float px = (player[dValue].transform.position.x + passedCardRotateValue2[i]);
            //float py = player[dValue].transform.position.y - 1.5f;
            cards[i].transform.position = new Vector3 (px, py, 0);
            Quaternion target2 = Quaternion.Euler (0, 0, passedCardRotateValue[i]);
            cards[i].transform.rotation = target2;
            playerEnableChe[i] = false;
        }
        int lastPassed = 0;

        if (i <= 5)
            dValue = i;
        else if (i > 5 && i <= 11)
            dValue = (i - 6);

        for (int j = 0; j < mplt * 3; j++) {
            int dValue2 = 0;
            if (j <= 5)
                dValue2 = j;
            else if (j > 5 && j <= 11)
                dValue2 = (j - 6);
            else if (j > 11)
                dValue2 = (j - 12);

            if (playerEnable[dValue2]) {
                lastPassed = j;
            }
        }
        bool ch2 = true;
        for (int j = i + 1; j <= 17 && ch2; j++) {
            int dValue2 = 0;
            if (j <= 5)
                dValue2 = j;
            else if (j > 5 && j <= 11)
                dValue2 = (j - 6);
            else if (j > 11)
                dValue2 = (j - 12);
            if (playerEnable[dValue2]) {
                playerEnableChe[j] = true;
                ch2 = false;
            }
        }
    }
    private string chipsShort (int chips) {
        string chStr = chips.ToString ();
        /*if (chips >= 100000 && chips < 10000000) {
            double div = chips / 100000.0;
            chStr = div.ToString ("F1") + " L";
        } else if (chips >= 10000000) {
            double div = chips / 10000000.0;
            chStr = div.ToString ("F1") + " Cr";
        }*/
        return chStr;
    }
    public void ClickSelectGame () {
        setMenuPanel (false);
        playPanel.gameObject.SetActive (true);
    }
    public void ClickPhoneVerification () {
        mobileVerifyPanel.gameObject.SetActive (true);
        mobileVerifyMainPanel.gameObject.SetActive (true);
        phoneNumberTxt.text = StartingValues.phoneNumber;
        verifyPhoneTxt.text = "Your phone is " + StartingValues.verify_mobile;
    }

    public void ClickPhoneVerificationBack () {
        mobileVerifyPanel.gameObject.SetActive (false);
        lobbiesArr.Clear ();
        foreach (var obj in lobbiesObjects) {
            Destroy (obj);
        }
        ClickRefresh ();
    }
    public void ClickChangeNumberBtn () {
        mobileVerifyMainPanel.gameObject.SetActive (false);

        otpPanel.gameObject.SetActive (false);
    }

    public void ClickOtpSubmit () {
        mobileVerifyMainPanel.gameObject.SetActive (true);
        otpPanel.gameObject.SetActive (false);
    }
    public void ClickOtpCancel () {
        mobileVerifyMainPanel.gameObject.SetActive (true);
        otpPanel.gameObject.SetActive (false);
    }
    public void ClickVerifyBtn () {
        otpPanel.gameObject.SetActive (true);

        mobileVerifyMainPanel.gameObject.SetActive (false);
    }
    public void ClickBuy () {
        purchasePanel.gameObject.SetActive (true);
    }
    public void ClickBackShop () {
        purchasePanel.gameObject.SetActive (false);
        ClickRefresh ();
    }

    public void ClickWithdrawMsg () {
        withdrawMsg.gameObject.SetActive (false);
        withdrawPanel2.gameObject.SetActive (true);
        withDrawStatusTxt2.gameObject.SetActive (false);
        withDrawStatusTxt2.text = "";
        withDrawStatusTxt.text = "";
        withdrawField.text = "";
        BankNameField.text = "";
        AccountNumberField.text = "";
        IFSCCodeField.text = "";
        withdrawPanel.gameObject.SetActive (false);
        ClickRefresh ();
    }
    public void ClickWithDrawBack () {
        withdrawPanel.gameObject.SetActive (false);
        ClickRefresh ();
    }

    public void ClickEye () {
        /*if (eyeToggle.isOn)
            loginPasswordField.contentType = InputField.ContentType.Standard;
        else
            loginPasswordField.contentType = InputField.ContentType.Password;*/
    }
    public void ClickLoginSubmit () {
        var go = EventSystem.current.currentSelectedGameObject;
        bool ch2 = true;
        string str = "";
        if (loginUsernameField.text == "") {
            str = "Invalid UserName";
            ch2 = false;
        }
        if (loginPasswordField.text == "") {
            str = "Invalid Password";
            ch2 = false;
        }
        if (ch2) {
            TestObject data = new TestObject ();
            data.email = loginUsernameField.text.ToString ();
            data.password = loginPasswordField.text.ToString ();
            socket.Emit ("VerifyUser", JsonUtility.ToJson (data));
            loadingScreen.gameObject.SetActive (true);
            loadingChe = true;
        }

    }
    public void ClickRegisterBtn () {
        registerPanel.gameObject.SetActive (true);
    }
    public void ClickRegisterSubmit () {
        bool ch2 = true;
        string str = "";
        if (regNameField.text.Length == 0) {
            str = "Fill the Name";
            ch2 = false;
        }
        if (regUsernameField.text.Length == 0) {
            str = "Fill theUsername";
            ch2 = false;
        }
        bool hasAt = regEmailField.text.IndexOf ('@') > 0;
        if (!hasAt) {
            str = "Invalid Email";
            ch2 = false;
        }
        if (regMobileField.text.Length <= 5) {
            str = "Invalid Mobile Number";
            ch2 = false;
        }
        if (regPasswordField.text.Length < 6) {
            str = "Password Character must 6 and above";
            ch2 = false;
        }

        if (ch2) {
            TestObject data = new TestObject ();
            data.name = regNameField.text;
            data.username = regUsernameField.text;
            data.email = regEmailField.text;
            data.mobile = regMobileField.text;
            data.password = regPasswordField.text;
            socket.Emit ("UserRegister", JsonUtility.ToJson (data));
            statusTxt.text = "Processing...";
        } else {
            statusTxt.text = str;
        }

    }
    public void ClickRegisterCancel () {
        statusTxt.text = "";
        registerPanel.gameObject.SetActive (false);
    }
    public void ClickAlertOk () {
        alertPanel.gameObject.SetActive (false);
        loadingScreen.gameObject.SetActive (false);
        loadingChe = false;
    }
    public void ClickSelectSeat () {
        if (!selectSeatChe) {
            if (StartingValues.balance_amount >= StartingValues.playerIn) {
                var go = EventSystem.current.currentSelectedGameObject;
                goBtnName = go.name;
                soundPlay (0);
                for (int i = 0; i < lobbiesArr.Count; i++) {
                    var jsonData = JSON.Parse (lobbiesArr[i]);
                    if (jsonData["id"].AsInt == room) {
                        MinText.text = StartingValues.playerIn.ToString ();
                        MaxText.text = StartingValues.balance_amount.ToString ();
                        slideValueText.text = StartingValues.playerIn.ToString ();
                        sliderMaxChips.value = 0;
                        sliderMaxChips.minValue = StartingValues.playerIn;
                        sliderMaxChips.maxValue = StartingValues.balance_amount;
                        playerAmtPanel.gameObject.SetActive (true);
                        seatPosition = int.Parse (go.name);
                    }
                }
                if (StartingValues.playing == "yes")
                    waitingTimeObj.gameObject.SetActive (true);
                else if (StartingValues.playing == "no") {
                    waitingTimeObj.gameObject.SetActive (false);
                }
            } else {
                balanceNotAvailable.gameObject.SetActive (true);
            }
        }
    }
    public void selectDragSliderValue () {
        slideValueText.text = ((int) sliderMaxChips.value).ToString ();
    }
    private void OnSeatFullConnected (string jStr) {
        var jsonData = JSON.Parse (jStr);
        playerSelectBtn[seatPosition - 1].gameObject.SetActive (true);
        playerInCancel ();
        selectSeatChe = false;
        seatOccupiedPanel.gameObject.SetActive (true);
    }
    public void CancelOccupied () {
        seatOccupiedPanel.gameObject.SetActive (false);
    }
    public void OkBalanceNotAvailable () {
        balanceNotAvailable.gameObject.SetActive (false);
    }

    public void playerInOk () {
        if (StartingValues.playing == "no") {
            StartingValues.player_amount = ((int) sliderMaxChips.value);
            //StartingValues.balance_amount -= StartingValues.player_amount;
            //inGamePlayerChipsTxt.text = ((int) StartingValues.balance_amount).ToString ();
            //menuChipsTxt.text = ((int) StartingValues.balance_amount).ToString ();
            playerAmtPanel.gameObject.SetActive (false);
            findOtherPlayerChe = false;
            selectSeatChe = true;
            playerSelectBtn[seatPosition - 1].gameObject.SetActive (false);
            TestObject data = new TestObject ();
            data.room = room.ToString ();
            data.playerIn = StartingValues.playerIn.ToString ();
            data.bankerIn = StartingValues.bankerIn.ToString ();

            data.username = StartingValues.email;
            data.username2 = StartingValues.username;
            data.email = StartingValues.email;
            data.balance_amount = StartingValues.balance_amount.ToString ();
            data.player_amount = StartingValues.player_amount.ToString ();
            data.seat = seatPosition.ToString ();
            data.commission = StartingValues.commission.ToString ();
            socket.Emit ("PlayerJoin", JsonUtility.ToJson (data));
        }
    }
    public void playerInCancel () {
        playerAmtPanel.gameObject.SetActive (false);
        sliderMaxChips.minValue = StartingValues.playerIn;
        sliderMaxChips.maxValue = StartingValues.balance_amount;
        MinText.text = StartingValues.playerIn.ToString ();
        MaxText.text = StartingValues.balance_amount.ToString ();
        slideValueText.text = StartingValues.playerIn.ToString ();
    }
    public void ClickSettings () {
        GameSettingObj.gameObject.SetActive (true);
        ClickSoundSideSettings ();
    }

    public void ClickSoundSideSettings () {
        muteAllToggle.isOn = (PlayerPrefs.GetInt ("MuteAll") == 1 ? true : false);
        cardShuffleToggle.isOn = (PlayerPrefs.GetInt ("CardShuffle") == 1 ? true : false);
        yourTurnToggle.isOn = (PlayerPrefs.GetInt ("YourTurn") == 1 ? true : false);
        chipMoveToggle.isOn = (PlayerPrefs.GetInt ("ChipMove") == 1 ? true : false);
        playerBetToggle.isOn = (PlayerPrefs.GetInt ("PlayerBet") == 1 ? true : false);
        playerRaiseToggle.isOn = (PlayerPrefs.GetInt ("PlayerRaise") == 1 ? true : false);
        playerPackToggle.isOn = (PlayerPrefs.GetInt ("PlayerPack") == 1 ? true : false);

        soundPanelObj.gameObject.SetActive (true);
        themePanelObj.gameObject.SetActive (false);
        playerSetUpPanel.gameObject.SetActive (false);
    }
    public void ClickThemeSideSettings () {
        soundPanelObj.gameObject.SetActive (false);
        themePanelObj.gameObject.SetActive (true);
        playerSetUpPanel.gameObject.SetActive (false);
    }
    public void ClickPlayerSideSettings () {
        player8Toggle.isOn = (PlayerPrefs.GetInt ("player8") == 1 ? true : false);
        player6Toggle.isOn = (PlayerPrefs.GetInt ("player6") == 1 ? true : false);
        player4Toggle.isOn = (PlayerPrefs.GetInt ("player4") == 1 ? true : false);
        player2Toggle.isOn = (PlayerPrefs.GetInt ("player2") == 1 ? true : false);
        soundPanelObj.gameObject.SetActive (false);
        themePanelObj.gameObject.SetActive (false);
        playerSetUpPanel.gameObject.SetActive (true);
    }
    public void ClickGSSave () {
        //sound 
        PlayerPrefs.SetInt ("MuteAll", (muteAllToggle.isOn?1 : 0));
        PlayerPrefs.SetInt ("CardShuffle", (cardShuffleToggle.isOn?1 : 0));
        PlayerPrefs.SetInt ("YourTurn", (yourTurnToggle.isOn?1 : 0));
        PlayerPrefs.SetInt ("ChipMove", (chipMoveToggle.isOn?1 : 0));
        PlayerPrefs.SetInt ("PlayerBet", (playerBetToggle.isOn?1 : 0));
        PlayerPrefs.SetInt ("PlayerRaise", (playerRaiseToggle.isOn?1 : 0));
        PlayerPrefs.SetInt ("PlayerPack", (playerPackToggle.isOn?1 : 0));

        setPlayerToggle ();
        //Themes
        changeTable ();
        GameSettingObj.gameObject.SetActive (false);
    }
    private void setPlayerToggle () {
        //Game Settings
        PlayerPrefs.SetInt ("player8", (player8Toggle.isOn?1 : 0));
        PlayerPrefs.SetInt ("player6", (player6Toggle.isOn?1 : 0));
        PlayerPrefs.SetInt ("player4", (player4Toggle.isOn?1 : 0));
        PlayerPrefs.SetInt ("player2", (player2Toggle.isOn?1 : 0));
    }
    public void ClickGSCancel () {
        GameSettingObj.gameObject.SetActive (false);
    }
    public void soundPlay (int bValue) {
        if (PlayerPrefs.GetInt ("MuteAll") == 0) {
            if (bValue == 0) {
                buttonSound.Play ();
            } else if (bValue == 1) {
                if (PlayerPrefs.GetInt ("YourTurn") == 0)
                    myturnSound.Play ();
            } else if (bValue == 2) {
                if (PlayerPrefs.GetInt ("ChipMove") == 0)
                    dropSound.Play ();
            } else if (bValue == 3) {
                if (PlayerPrefs.GetInt ("PlayerPack") == 0)
                    packSound.Play ();
            }
        }
    }
    public void ClickSelectTheme () {
        var go = EventSystem.current.currentSelectedGameObject;
        //PlayerPrefs.GetInt ("SelectTheme");
        if (go.name == "1")
            PlayerPrefs.SetInt ("SelectTheme", 1);
        else if (go.name == "2")
            PlayerPrefs.SetInt ("SelectTheme", 2);
        else if (go.name == "3")
            PlayerPrefs.SetInt ("SelectTheme", 3);
    }
    public void ClickRefresh () {
        TestObject data = new TestObject ();
        data.email = PlayerPrefs.GetString ("username");
        data.password = PlayerPrefs.GetString ("password");
        socket.Emit ("VerifyUser", JsonUtility.ToJson (data));
        //loadingScreen.gameObject.SetActive (true);
        //loadingChe = true;
    }
    void OnApplicationQuit () {
        ClickMainSideBackBtn2 ();
    }
    void OnApplicationFocus (bool hasFocus) {
        socket.Emit ("Focus");
    }

    void OnApplicationPause (bool pauseStatus) {
        //socket.Emit ("RemovePlayer");
    }

    public void ClickMainSideBackBtn () {
        socket.Emit ("BackBtn");
    }
    public void ClickMainSideBackBtn2 () {
        socket.Emit ("RemovePlayer");
        //socket.Close ();
        soundPlay (0);
        resetGame ();
        setYouPanel (false);
        /*TestObject data = new TestObject ();
        data.username = StartingValues.username;
        socket.Emit ("GetChips", JsonUtility.ToJson (data));*/
        //serverExitChe = true;
        //serverConnectChe = false;
        loadingScreen.gameObject.SetActive (true);
        loadingChe = true;
        selectSeatChe = false;
        StartingValues.playing = "yes";
        for (int i = 0; i < 6; i++) {
            player[i].gameObject.SetActive (false);
            playerHalf[i].gameObject.SetActive (false);
            playerSelectBtn[i].gameObject.SetActive (true);
        }
        lobbyPanel.gameObject.SetActive (true);
        setSidePanel (false);
        inGameChe = false;
    }
    private void OnBackBtnConnected (string jStr) {
        var jsonData = JSON.Parse (jStr);
        if (jsonData["result"].Value == "yes")
            ClickMainSideBackBtn2 ();
    }
    public void ClickSideBackBtn () {
        soundPlay (0);
        setSidePanel (false);
    }
    public void ClickSideCloseBtn () {
        soundPlay (0);
        setSidePanel (false);
    }
    public void ClickSideExitToLobby () {

    }

    public void ClickChatBtn () {
        soundPlay (0);
        ChatPanel.gameObject.SetActive (true);
        ChatBtn.gameObject.SetActive (false);

    }
    public void ClickChatBackBtn () {
        soundPlay (0);
        ChatPanel.gameObject.SetActive (false);
        ChatBtn.gameObject.SetActive (true);
    }

    public void ClickSend () {
        if (inputChat.text != "") {
            TestObject data = new TestObject ();
            data.msg = inputChat.text;
            socket.Emit ("CHAT", JsonUtility.ToJson (data));
            inputChat.text = "";
            soundPlay (0);
        }
    }
    public void ClickInternetCancel () {
        soundPlay (0);
    }
    public void ClickInternetOK () {
        ConnectChe = true;
        internetCheckPanel.gameObject.SetActive (false);
    }
    public void ClickRules () {
        rulesPanel.gameObject.SetActive (true);

    }
    public void ClickRulesBack () {
        rulesPanel.gameObject.SetActive (false);
    }

    public void setYouPanel (bool sbool) {
        Animator animator = YouPanel.GetComponent<Animator> ();
        animator.SetBool ("YouPanel", sbool);

    }
    public void setSidePanel (bool sbool) {
        if (sidePanelAnim != null) {
            Animator animator = sidePanelAnim.GetComponent<Animator> ();
            if (animator != null) {
                animator.SetBool ("sidePanel", sbool);
            }
        }
    }

    public void setMenuPanel (bool sbool) {
        Animator animator = MenuList.GetComponent<Animator> ();
        animator.SetBool ("sidePanel", sbool);
    }
    private void generateOrigCardsFunc (int cSee) {
        for (int i = 0; i < mplt * 3; i++) {
            int dValue = 0;
            int rValue = 0;
            if (i <= 5) {
                dValue = i;
                rValue = 1;
            } else if (i > 5 && i <= 11) {
                dValue = (i - 6);
                rValue = 2;
            } else if (i > 11) {
                dValue = (i - 12);
                rValue = 3;
            }
            if (dValue == cSee) {
                print (rValue + " " + numberOfCards);
                if (rValue <= numberOfCards) {
                    callSpriteRender (totalCards2[i], i, cards[i].transform.position, dValue);
                }
                cards[i].transform.localScale = new Vector3 (0, 0, 0);
            }
        }
    }

    private void callSpriteRender (int arrayIdx, int i, Vector3 pos, int dValue) {

        if (flipCards[i] == null) {
            //int arrayIdx = Random.Range(0, animalSprites.Length);
            Sprite animalSprite = animalSprites[arrayIdx];
            //Sprite animalSprite = animalSprites[0];
            string animalName = animalSprite.name;
            flipCards[i] = Instantiate (animalPrefab);
            print ("success ");

            flipCards[i].transform.position = pos;
            flipCards[i].transform.localScale = new Vector3 (1f, 1f, 1f);

            flipCards[i].transform.rotation = cards[i].transform.rotation;
            flipCards[i].name = animalName;
            flipCards[i].GetComponent<Animal> ().animalName = animalName;
            flipCards[i].GetComponent<SpriteRenderer> ().sprite = animalSprite;
            sOrder += 1;
            //if (dValue == 3 || dValue == 4)
            //    flipCards[i].GetComponent<SpriteRenderer> ().sortingOrder = 25 - sOrder;
            //else
            flipCards[i].GetComponent<SpriteRenderer> ().sortingOrder = 26 + sOrder;

        }
    }

    private void callFrontCardRender (int i, int dValue) {

        Sprite frontSprite = frontCardSprite;
        string animalName = frontSprite.name;

        cards[i] = Instantiate (frontCardPrefab);
        cardPassed[i] = false;
        cards[i].name = animalName;
        cards[i].GetComponent<Animal> ().animalName = animalName;
        cards[i].GetComponent<SpriteRenderer> ().sprite = frontSprite;
        sOrder2 += 1;
        cards[i].GetComponent<SpriteRenderer> ().sortingOrder = 26 + sOrder2;
    }
    public int[] shiftRight (int[] arr) {
        int[] demo = new int[arr.Length];
        for (int i = 1; i < arr.Length; i++) {
            demo[i] = arr[i - 1];
        }
        demo[0] = arr[demo.Length - 1];
        return demo;
    }

    public Texture2D ReadTextureFromPlayerPrefs (string tag) {
        string base64Tex = tag;
        if (!string.IsNullOrEmpty (base64Tex)) {
            byte[] texByte = System.Convert.FromBase64String (base64Tex);
            Texture2D tex = new Texture2D (2, 2);
            if (tex.LoadImage (texByte)) {
                return tex;
            }
        }
        return null;
    }
    IEnumerator ConnectToServer () {
        yield return new WaitForSeconds (0.5f);
        socket.Emit ("Server_Started");
    }
    private void OnVerifyUserConnected (string jStr) {
        var jsonData = JSON.Parse (jStr);
        print ("Verify success " + jsonData["result"].Value);
        if (jsonData["result"].Value == "no") {
            alertPanel.gameObject.SetActive (true);
            loadingScreen.gameObject.SetActive (false);
            //loginWindow.gameObject.SetActive (true);
            loadingChe = false;
            PlayerPrefs.SetString ("login", "fail");
        } else if (jsonData["result"].Value == "yes") {
            StartingValues.username = jsonData["username"].Value;
            StartingValues.email = jsonData["email"].Value;
            StartingValues.password = jsonData["password"].Value;
            StartingValues.balance_amount = jsonData["chips"].AsInt;

            menuNameTxt.text = StartingValues.username;
            menuChipsTxt.text = StartingValues.balance_amount.ToString ();
            loginScreen.gameObject.SetActive (false);
            loginScreenEnable = false;
            splashScreen.gameObject.SetActive (false);

            playPanel.gameObject.SetActive (true);
            if (eyeToggle.isOn) {
                PlayerPrefs.SetString ("login", "success");
                PlayerPrefs.SetString ("username", StartingValues.email);
                PlayerPrefs.SetString ("password", StartingValues.password);
            } else {
                PlayerPrefs.SetString ("login", "fail");
            }
            topBackBtn.gameObject.SetActive (false);
            loadingScreen.gameObject.SetActive (false);
            loadingChe = false;
            ClickDefaultGameList ();
        }
    }

    private void OnUserConnected (string jStr) {
        Debug.Log ("SocketIO connected");
        serverConnectChe = true;
        if (serverExitChe) {
            serverExitChe = false;
            loadingScreen.gameObject.SetActive (false);
            loadingChe = false;
        } else {
            if (PlayerPrefs.GetString ("login") == "success") {
                ClickRefresh ();
            } else {
                if (checkLoginChe) {
                    checkLoginChe = false;
                    splashScreen.gameObject.SetActive (false);
                    loginScreen.gameObject.SetActive (true);
                }
            }
        }
    }

    //Room Connected
    private void OnRoomConnected (string jStr) {
        var jsonData = JSON.Parse (jStr);
        TestObject data = new TestObject ();
        data.username = StartingValues.email;
        data.username2 = StartingValues.username;
        data.room = room.ToString ();
        data.balance_amount = StartingValues.balance_amount.ToString ();
        data.player_amount = StartingValues.player_amount.ToString ();
        data.bankerIn = StartingValues.bankerIn.ToString ();
        data.seat = seatPosition.ToString ();
        socket.Emit ("PlayerJoin", JsonUtility.ToJson (data));
    }

    //Player Connected
    private void OnPlayerJoinConnected (string jStr) {
        var jsonData = JSON.Parse (jStr);
        player[jsonData["seat"].AsInt].gameObject.SetActive (true);
        playerHalf[jsonData["seat"].AsInt].gameObject.SetActive (true);
        playerSelectBtn[jsonData["seat"].AsInt].gameObject.SetActive (false);

        playerAmountTxt[jsonData["seat"].AsInt].text = ((int) jsonData["player_amount"].AsInt).ToString ();
        playerNameTxt[jsonData["seat"].AsInt].text = jsonData["username"].Value;
        playerAmountTxt[jsonData["seat"].AsInt].gameObject.SetActive (true);
        playerNameTxt[jsonData["seat"].AsInt].gameObject.SetActive (true);
        playerEnable[jsonData["seat"].AsInt] = true;
        player[jsonData["seat"].AsInt].GetComponent<Renderer> ().material.color = new Color (1f, 1f, 1f, 1f);
        playerHalf[jsonData["seat"].AsInt].GetComponent<Renderer> ().material.color = new Color (1f, 1f, 1f, 1f);

    }

    private void OnPlayerWatchConnected (string jStr) {
        var jsonData = JSON.Parse (jStr);
        player[jsonData["seat"].AsInt].gameObject.SetActive (true);
        playerHalf[jsonData["seat"].AsInt].gameObject.SetActive (true);
        player[jsonData["seat"].AsInt].GetComponent<Renderer> ().material.color = new Color (0.5f, 0.5f, 0.5f, 0.5f);
        playerHalf[jsonData["seat"].AsInt].GetComponent<Renderer> ().material.color = new Color (0.5f, 0.5f, 0.5f, 0.5f);
        playerSelectBtn[jsonData["seat"].AsInt].gameObject.SetActive (false);
        playerNameTxt[jsonData["seat"].AsInt].text = jsonData["username"].Value;
        playerNameTxt[jsonData["seat"].AsInt].gameObject.SetActive (true);
    }

    private void OnAutoConnected (string jStr) {
        var jsonData = JSON.Parse (jStr);
        playerHalf[jsonData["seat"].AsInt].GetComponent<SpriteRenderer> ().sprite = plainSprite.sprite;
        playerStatusTxt[jsonData["seat"].AsInt].text = "AUTO";
        numberOfCards = jsonData["numberOfCards"].AsInt;
        generateOrigCardsFunc (jsonData["seat"].AsInt);

    }
    private void OnGameStartInConnected (string jStr) {
        var jsonData = JSON.Parse (jStr);
        bankerFunc (jsonData["dealer"].AsInt);
        instructionTxt.text = "";
        playerAmountTxt[jsonData["seat"].AsInt].text = ((int) jsonData["player_amount"].AsInt).ToString ();
        playerBetTxt[jsonData["seat"].AsInt].text = ((int) jsonData["bet"].AsInt).ToString ();
        playerBetSprite[jsonData["seat"].AsInt].gameObject.SetActive (true);

    }
    private void OnGameStartTimerConnected (string jStr) {
        var jsonData = JSON.Parse (jStr);
        instructionTxt.text = jsonData["time"].Value;

    }
    private void bankerFunc (int i) {
        bankerObj.gameObject.SetActive (true);
        Vector3 vec = new Vector3 (player[i].transform.position.x, player[i].transform.position.y - 1.2f, player[i].transform.position.z);
        bankerObj.transform.position = vec;
    }

    private void OnPlyingUserConnected (string jStr) {
        var jsonData = JSON.Parse (jStr);
        if (jsonData["playing"].Value == "yes") {
            playedSeat = jsonData["seat"].AsInt;
            print ("playing user" + playedSeat);
            StartingValues.playing = "yes";
            playerAmountTxt[jsonData["seat"].AsInt].text = ((int) jsonData["player_amount"].AsInt).ToString ();
            playerNameTxt[jsonData["seat"].AsInt].text = jsonData["username"].Value;
            player[jsonData["seat"].AsInt].gameObject.SetActive (true);
            playerHalf[jsonData["seat"].AsInt].gameObject.SetActive (true);
            playerSelectBtn[jsonData["seat"].AsInt].gameObject.SetActive (false);
            playerAmountTxt[jsonData["seat"].AsInt].gameObject.SetActive (true);
            playerNameTxt[jsonData["seat"].AsInt].gameObject.SetActive (true);

        }
        if (jsonData["playing"].Value == "no") {
            StartingValues.playing = "no";
            if (playedSeat != -1) {
                player[playedSeat].gameObject.SetActive (false);
                playerHalf[playedSeat].gameObject.SetActive (false);
                playerBetSprite[playedSeat].gameObject.SetActive (false);
                playerSelectBtn[playedSeat].gameObject.SetActive (true);
                playerEnable[playedSeat] = false;
                playerBetTxt[playedSeat].text = "";
                playerAmountTxt[playedSeat].text = "";
                playerNameTxt[playedSeat].text = "";
            }
        }
        if (jsonData["playing"].Value == "view") {
            playerAmountTxt[jsonData["seat"].AsInt].text = ((int) jsonData["player_amount"].AsInt).ToString ();
            playerNameTxt[jsonData["seat"].AsInt].text = jsonData["username"].Value;
            player[jsonData["seat"].AsInt].gameObject.SetActive (true);
            playerHalf[jsonData["seat"].AsInt].gameObject.SetActive (true);
            playerSelectBtn[jsonData["seat"].AsInt].gameObject.SetActive (false);
            playerAmountTxt[jsonData["seat"].AsInt].gameObject.SetActive (true);
            playerNameTxt[jsonData["seat"].AsInt].gameObject.SetActive (true);
        }

    }
    private void OnYouConnected (string jStr) {
        var jsonData = JSON.Parse (jStr);
        you = jsonData["seat"].AsInt;
        wait = jsonData["wait"].AsInt;
        inGamePlayerChipsTxt.text = ((int) StartingValues.balance_amount).ToString ();
        menuChipsTxt.text = ((int) StartingValues.balance_amount).ToString ();
    }

    private void OnAnnouncementConnected (string jStr) {
        var jsonData = JSON.Parse (jStr);
        if (jsonData["status"].AsInt == 1) {
            message = jsonData["message"].Value;
        }
    }
    private void OnSettingsConnected (string jStr) {
        var jsonData = JSON.Parse (jStr);
        StartingValues.commission = jsonData["commission"].AsInt;
    }

    private void OnStartTimerConnected (string jStr) {
        var jsonData = JSON.Parse (jStr);
        StartingValues.banker_amount = jsonData["banker"].AsInt;
        playerHalf[jsonData["seat"].AsInt].GetComponent<SpriteRenderer> ().sprite = plainSprite.sprite;
        if (jsonData["seat"].AsInt != jsonData["dealer"].AsInt) {
            otherEnableChe[jsonData["seat"].AsInt] = true;
            if (you == jsonData["seat"].AsInt) {
                var percMin = ((StartingValues.bankerIn / 100.0) * 10);
                var percMax = jsonData["player_amount"].AsInt / 5;
                if (percMax > StartingValues.banker_amount)
                    percMax = StartingValues.banker_amount;
                print ("player " + percMax);
                youPanelMinTxt.text = ((int) percMin).ToString ();
                youPanelMaxTxt.text = ((int) percMax).ToString ();

                youPanelSlider.minValue = (int) percMin;
                youPanelSlider.maxValue = (int) percMax;
                youPanelSlider.value = 0f;
                youPanelSliderTxt.text = ((int) youPanelSlider.value).ToString ();
                setYouPanel (true);
            }
        }
        betTimerChe = true;
    }
    public void youSlideChangeValue () {
        youPanelSliderTxt.text = ((int) youPanelSlider.value).ToString ();
    }
    private void OnStartCardPassConnected (string jStr) {
        var jsonData = JSON.Parse (jStr);
        string strShuffle = jsonData["shuffle"].Value;
        strShuffle = strShuffle + "";
        string[] strArr = strShuffle.Split (' ');
        for (int i = 0; i < 52; i++)
            totalCards2[i] = int.Parse (strArr[i]);
        checkPlayerEnableFunc (-1, 0);
        cardStartPass = true;

    }

    private void OnBetConnected (string jStr) {
        var jsonData = JSON.Parse (jStr);
        if (StartingValues.playing == "no") {
            playerBetTxt[jsonData["seat"].AsInt].text = ((int) jsonData["bet"].AsInt).ToString ();
            playerBetSprite[jsonData["seat"].AsInt].gameObject.SetActive (true);
            playerAmountTxt[jsonData["seat"].AsInt].text = ((int) jsonData["player_amount"].AsInt).ToString ();
            if (jsonData["closeTimer"].Value != "yes")
                setYouPanel (false);
            betTimerChe = false;
            otherEnableChe[jsonData["seat"].AsInt] = false;
            bar[jsonData["seat"].AsInt].fillAmount = 0;
        }

    }
    public void ClickOkBet () {
        TestObject data = new TestObject ();
        data.bet = youPanelSlider.value.ToString ();
        socket.Emit ("BET", JsonUtility.ToJson (data));
        setYouPanel (false);
    }
    public void ClickMaxBet () {

    }
    private void OnStartShowCard2Connected (string jStr) {
        var jsonData = JSON.Parse (jStr);
        if (StartingValues.playing == "no") {
            if (jsonData["dealerShowCard"].AsInt == 0) {
                if (jsonData["seat"].AsInt != jsonData["dealer"].AsInt) {
                    otherEnableChe[jsonData["seat"].AsInt] = true;
                    betTimerChe = true;
                    bar_value = 0;

                }
            } else if (jsonData["dealerShowCard"].AsInt == 1) {
                if (jsonData["seat"].AsInt == jsonData["dealer"].AsInt) {
                    otherEnableChe[jsonData["seat"].AsInt] = true;
                    betTimerChe = true;
                    bar_value = 0;
                }
            }
            rotatingChe = true;
        }

    }
    private void OnStartShowCardConnected (string jStr) {
        var jsonData = JSON.Parse (jStr);
        if (StartingValues.playing == "no") {
            previousStr = jStr;
            bool ch2 = false;
            if (jsonData["dealerShowCard"].AsInt == 0) {
                if (you != jsonData["dealer"].AsInt) {
                    print ("wel " + jsonData["seat"].AsInt + " " + jsonData["cardShowCompleted"].AsInt);
                    if (jsonData["cardShowCompleted"].AsInt == 0)
                        ch2 = true;
                }
            } else if (jsonData["dealerShowCard"].AsInt == 1) {
                if (you == jsonData["dealer"].AsInt) {
                    ch2 = true;
                }
            }
            if (ch2) {
                Vector3 newPosition = new Vector3 (frontSwipePos.x, frontSwipePos.y + 750.0f, showCards[0].transform.position.z);
                StartCoroutine (MoveToPos (newPosition, frontSwipePos, 0));
                showCards[0].transform.position = newPosition;
                showCards[1].transform.position = newPosition;
                showCards[0].sprite = frontCardSprite;
                showCards[1].sprite = frontCardSprite;
                swipePanel.gameObject.SetActive (true);
            }
        }
    }
    private void showConnect2 () {
        var jsonData = JSON.Parse (previousStr);
        bool ch2 = false;
        if (jsonData["dealerShowCard"].AsInt == 0) {
            if (you != jsonData["dealer"].AsInt)
                ch2 = true;
        } else if (jsonData["dealerShowCard"].AsInt == 1) {
            if (you == jsonData["dealer"].AsInt)
                ch2 = true;
        }
        if (ch2) {
            numberOfCards = jsonData["numberOfCards"].AsInt;
            if (jsonData["numberOfCards"].AsInt == 2) {
                showCardRender (jsonData["carStr1"].AsInt, 0);
                showCardRender (jsonData["carStr2"].AsInt, 1);
            } else if (jsonData["numberOfCards"].AsInt == 3) {
                showCardRender (jsonData["carStr1"].AsInt, 0);
                showCardRender (jsonData["carStr3"].AsInt, 1);
            }

            if (jsonData["dealerShowCard"].AsInt == 0) {
                if (jsonData["numberOfCards"].AsInt == 2) {
                    if (jsonData["valueCard"].AsInt <= 2) {
                        playerDrawBtn.gameObject.SetActive (true);
                    } else if (jsonData["valueCard"].AsInt >= 3 && jsonData["valueCard"].AsInt <= 5) {
                        playerHoldBtn.gameObject.SetActive (true);
                        playerDrawBtn.gameObject.SetActive (true);
                    } else if (jsonData["valueCard"].AsInt == 6 || jsonData["valueCard"].AsInt == 7) {
                        playerHoldBtn.gameObject.SetActive (true);
                    } else if (jsonData["valueCard"].AsInt == 8 || jsonData["valueCard"].AsInt == 9) {
                        playerDoneBtn.gameObject.SetActive (true);
                    }
                } else if (jsonData["numberOfCards"].AsInt == 3) {
                    playerDoneBtn.gameObject.SetActive (true);
                }
            } else if (jsonData["dealerShowCard"].AsInt == 1) {
                if (jsonData["numberOfCards"].AsInt == 2) {
                    if (jsonData["playerCards"].AsInt == 1) {
                        if (jsonData["valueCard"].AsInt <= 2) {
                            playerDrawBtn.gameObject.SetActive (true);
                        } else if (jsonData["valueCard"].AsInt >= 3 && jsonData["valueCard"].AsInt <= 5) {
                            playerAllBtn.gameObject.SetActive (true);
                            playerDrawBtn.gameObject.SetActive (true);
                        } else if (jsonData["valueCard"].AsInt == 6 || jsonData["valueCard"].AsInt == 7) {
                            playerAllBtn.gameObject.SetActive (true);
                        } else if (jsonData["valueCard"].AsInt == 8 || jsonData["valueCard"].AsInt == 9) {
                            playerDoneBtn.gameObject.SetActive (true);
                        }
                    } else if (jsonData["playerCards"].AsInt == 2) {
                        if (jsonData["valueCard"].AsInt >= 0 && jsonData["valueCard"].AsInt <= 5) {
                            playerAllBtn.gameObject.SetActive (true);
                            playerDrawBtn.gameObject.SetActive (true);
                        } else if (jsonData["valueCard"].AsInt == 6 || jsonData["valueCard"].AsInt == 7) {
                            playerAllBtn.gameObject.SetActive (true);
                        } else if (jsonData["valueCard"].AsInt == 8 || jsonData["valueCard"].AsInt == 9) {
                            playerDoneBtn.gameObject.SetActive (true);
                        }
                    } else if (jsonData["playerCards"].AsInt == 3) {
                        if (jsonData["valueCard"].AsInt <= 2) {
                            playerThreeCardBtn.gameObject.SetActive (true);
                            playerDrawBtn.gameObject.SetActive (true);
                        } else if (jsonData["valueCard"].AsInt >= 3 && jsonData["valueCard"].AsInt <= 5) {
                            playerAllBtn.gameObject.SetActive (true);
                            playerDrawBtn.gameObject.SetActive (true);
                        } else if (jsonData["valueCard"].AsInt == 6 || jsonData["valueCard"].AsInt == 7) {
                            playerAllBtn.gameObject.SetActive (true);
                        } else if (jsonData["valueCard"].AsInt == 8 || jsonData["valueCard"].AsInt == 9) {
                            playerDoneBtn.gameObject.SetActive (true);
                        }
                    }
                } else if (jsonData["numberOfCards"].AsInt == 3) {
                    playerDoneBtn.gameObject.SetActive (true);
                }
            }
        }
    }
    IEnumerator MoveToPos (Vector3 startPos, Vector3 endPos, int moveValue) {
        float t = 0f;
        while (t < 1.3f) {
            showCards[moveValue].transform.position = Vector3.Lerp (startPos, endPos, t);
            t += Time.deltaTime * 3f;
            yield return null;
        }
        showCards[moveValue].transform.position = frontSwipePos;
        if (moveValue <= 0) {
            Vector3 newPosition = new Vector3 (frontSwipePos.x, frontSwipePos.y + 750.0f, showCards[0].transform.position.z);
            StartCoroutine (MoveToPos (newPosition, frontSwipePos, 1));
        } else {
            StartCoroutine (MoveFlip (0));
        }
    }
    IEnumerator MoveFlip (int moveValue) {
        float t = 0f;
        float lScale = 1;
        lScale = (moveValue == 0 ? 1 : 0);
        while (t < 1.0f) {
            if (moveValue == 0) {
                lScale -= Time.deltaTime * 4;
                showCards[0].transform.localScale = new Vector3 (lScale * 1.0f, 1.0f, 1.0f);
            } else {
                lScale += Time.deltaTime * 4;
                showCards[0].transform.localScale = new Vector3 (lScale * 1.0f, 1.0f, 1.0f);
            }
            t += Time.deltaTime * 4;
            yield return null;
        }
        if (moveValue == 0) {
            StartCoroutine (MoveFlip (1));
            var jsonData = JSON.Parse (previousStr);
            showCardRender (jsonData["carStr1"].AsInt, 0);
        } else {
            showConnect2 ();
        }

    }
    private void showCardRender (int arrayIdx, int i) {
        Sprite animalSprite = animalSprites[arrayIdx];
        showCards[i].sprite = animalSprite;

    }
    public void playerDraw () {
        TestObject data = new TestObject ();
        data.message = "DRAW";
        socket.Emit ("DRAW", JsonUtility.ToJson (data));
        playerDrawBtn.gameObject.SetActive (false);
        playerHoldBtn.gameObject.SetActive (false);
        playerDoneBtn.gameObject.SetActive (false);
        playerAllBtn.gameObject.SetActive (false);
        playerThreeCardBtn.gameObject.SetActive (false);
    }
    public void playerHold () {
        swipePanel.gameObject.SetActive (false);
        playerDrawBtn.gameObject.SetActive (false);
        playerHoldBtn.gameObject.SetActive (false);
        playerDoneBtn.gameObject.SetActive (false);
        playerAllBtn.gameObject.SetActive (false);
        playerThreeCardBtn.gameObject.SetActive (false);
        generateOrigCardsFunc (you);
        TestObject data = new TestObject ();
        data.message = "HOLD";
        socket.Emit ("CardShowCompleted", JsonUtility.ToJson (data));
    }
    public void player3Card () {
        TestObject data = new TestObject ();
        data.message = "THREE";
        socket.Emit ("ThreeCard", JsonUtility.ToJson (data));
        swipePanel.gameObject.SetActive (false);
        playerDrawBtn.gameObject.SetActive (false);
        playerHoldBtn.gameObject.SetActive (false);
        playerDoneBtn.gameObject.SetActive (false);
        playerAllBtn.gameObject.SetActive (false);
        playerThreeCardBtn.gameObject.SetActive (false);
    }
    public void playerDone () {
        swipePanel.gameObject.SetActive (false);
        playerDrawBtn.gameObject.SetActive (false);
        playerHoldBtn.gameObject.SetActive (false);
        playerDoneBtn.gameObject.SetActive (false);
        playerAllBtn.gameObject.SetActive (false);
        playerThreeCardBtn.gameObject.SetActive (false);
        generateOrigCardsFunc (you);
        TestObject data = new TestObject ();
        data.message = "DONE";
        socket.Emit ("CardShowCompleted", JsonUtility.ToJson (data));
    }
    public void playerAll () {
        generateOrigCardsFunc (you);
        TestObject data = new TestObject ();
        data.message = "ALL";
        socket.Emit ("CardShowCompleted", JsonUtility.ToJson (data));
        swipePanel.gameObject.SetActive (false);
        playerDrawBtn.gameObject.SetActive (false);
        playerHoldBtn.gameObject.SetActive (false);
        playerDoneBtn.gameObject.SetActive (false);
        playerAllBtn.gameObject.SetActive (false);
        playerThreeCardBtn.gameObject.SetActive (false);
    }

    private void OnBalanceNotConnected (string jStr) {
        //ClickMainSideBackBtn ();
        balanceNotAvailable.gameObject.SetActive (true);
    }
    private void OnMESSAGEConnected (string jStr) {
        var jsonData = JSON.Parse (jStr);
        chatBack[jsonData["seat"].AsInt].gameObject.SetActive (true);
        chatTxt[jsonData["seat"].AsInt].text = jsonData["message"].Value;
        StartCoroutine (chatMessageDisable (jsonData["seat"].AsInt));
    }

    private void OnWARNINGConnected (string jStr) {
        var jsonData = JSON.Parse (jStr);
        chatBack[jsonData["seat"].AsInt].gameObject.SetActive (true);
        if (jsonData["message"].AsInt == 1)
            chatTxt[jsonData["seat"].AsInt].text = jsonData["message"].Value + "st Warning";
        if (jsonData["message"].AsInt == 2)
            chatTxt[jsonData["seat"].AsInt].text = jsonData["message"].Value + "nd Warning";
        if (jsonData["message"].AsInt == 3)
            chatTxt[jsonData["seat"].AsInt].text = jsonData["message"].Value + "rd Warning";
        StartCoroutine (chatMessageDisable (jsonData["seat"].AsInt));
    }
    IEnumerator chatMessageDisable (int seat) {
        float t = 0f;
        while (t < 2.0f) {
            t += Time.deltaTime * 0.7f;
            yield return null;
        }
        chatBack[seat].gameObject.SetActive (false);
        chatTxt[seat].text = "";
    }
    private void OnEndShowCard2Connected (string jStr) {
        var jsonData = JSON.Parse (jStr);
        if (StartingValues.playing == "no") {
            otherEnableChe[jsonData["seat"].AsInt] = false;
            betTimerChe = false;
            bar_value = 0;
            bar[jsonData["seat"].AsInt].fillAmount = 0;
            rotatingChe = false;
            int nOfCards = jsonData["numberOfCards"].AsInt;
            if (nOfCards != 0) {
                for (int i = 0; i < mplt * 3; i++) {
                    int dValue = 0;
                    int rValue = 0;
                    if (i <= 5) {
                        dValue = i;
                        rValue = 1;
                    } else if (i > 5 && i <= 11) {
                        dValue = (i - 6);
                        rValue = 2;
                    } else if (i > 11) {
                        dValue = (i - 12);
                        rValue = 3;
                    }
                    if (dValue == jsonData["seat"].AsInt) {
                        if (rValue <= nOfCards) {
                            cards[i].transform.localScale = new Vector3 (1, 1, 1);
                        }
                    }
                }
            }
        }
    }
    private void OnEndShowCardConnected (string jStr) {
        var jsonData = JSON.Parse (jStr);
        if (StartingValues.playing == "no") {
            otherEnableChe[jsonData["seat"].AsInt] = false;
            betTimerChe = false;
            bar_value = 0;
            bar[jsonData["seat"].AsInt].fillAmount = 0;
            bool ch2 = false;
            if (jsonData["dealerShowCard"].AsInt == 0) {
                if (you != jsonData["dealer"].AsInt)
                    ch2 = true;
            } else if (jsonData["dealerShowCard"].AsInt == 1) {
                if (you == jsonData["dealer"].AsInt) {
                    ch2 = true;
                }
            }
            if (ch2) {
                numberOfCards = jsonData["numberOfCards"].AsInt;
                swipePanel.gameObject.SetActive (false);
                playerDrawBtn.gameObject.SetActive (false);
                playerHoldBtn.gameObject.SetActive (false);
                playerDoneBtn.gameObject.SetActive (false);
                playerAllBtn.gameObject.SetActive (false);
                playerThreeCardBtn.gameObject.SetActive (false);
                generateOrigCardsFunc (you);
            }
        }

    }

    private void OnExitUpdateCashConnected (string jStr) {
        var jsonData = JSON.Parse (jStr);
        StartingValues.balance_amount = jsonData["player_amount"].AsInt;
        menuChipsTxt.text = ((int) StartingValues.balance_amount).ToString ();
        inGamePlayerChipsTxt.text = ((int) StartingValues.balance_amount).ToString ();
        loadingScreen.gameObject.SetActive (false);
        loadingChe = false;

    }
    private void OnWinResultConnected (string jStr) {
        var jsonData = JSON.Parse (jStr);
        if (StartingValues.playing == "no") {
            playerHalf[jsonData["seat"].AsInt].GetComponent<SpriteRenderer> ().sprite = winSprite.sprite;
            scoreValueBack[jsonData["seat"].AsInt].gameObject.SetActive (true);
            scoreValueTxt[jsonData["seat"].AsInt].text = jsonData["scoreValue"].Value;

            if (jsonData["result"].AsInt != 0) {
                playerWinStatusTxt[jsonData["seat"].AsInt].color = Color.green;
                playerWinStatusTxt[jsonData["seat"].AsInt].text = "WIN";
                if (jsonData["wResult"].AsInt == 2)
                    playerX2StatusTxt[jsonData["seat"].AsInt].text = "X2";
                else if (jsonData["wResult"].AsInt == 3)
                    playerX2StatusTxt[jsonData["seat"].AsInt].text = "X3";
                else if (jsonData["wResult"].AsInt == 5)
                    playerX2StatusTxt[jsonData["seat"].AsInt].text = "X5";

                numberOfCards = jsonData["numberOfCards"].AsInt;
                generateOrigCardsFunc (jsonData["seat"].AsInt);
            } else if (jsonData["result"].AsInt == 0) {
                playerWinStatusTxt[jsonData["seat"].AsInt].text = "LOSS";
                playerWinStatusTxt[jsonData["seat"].AsInt].color = Color.red;
                numberOfCards = jsonData["numberOfCards"].AsInt;
                generateOrigCardsFunc (jsonData["seat"].AsInt);
            }
        }
    }

    private void OnWinResult2Connected (string jStr) {
        var jsonData = JSON.Parse (jStr);
        if (StartingValues.playing == "no") {
            scoreValueBack[jsonData["seat"].AsInt].gameObject.SetActive (true);
            scoreValueTxt[jsonData["seat"].AsInt].text = jsonData["scoreValue"].Value;
            playerHalf[jsonData["seat"].AsInt].GetComponent<SpriteRenderer> ().sprite = winSprite.sprite;
            if (jsonData["wResult"].AsInt == 2)
                playerX2StatusTxt[jsonData["seat"].AsInt].text = "X2";
            else if (jsonData["wResult"].AsInt == 3)
                playerX2StatusTxt[jsonData["seat"].AsInt].text = "X3";
            else if (jsonData["wResult"].AsInt == 5)
                playerX2StatusTxt[jsonData["seat"].AsInt].text = "X5";
            numberOfCards = jsonData["numberOfCards"].AsInt;
            generateOrigCardsFunc (jsonData["seat"].AsInt);
        }
    }

    private void OnUpdateChipsConnected (string jStr) {
        var jsonData = JSON.Parse (jStr);
        playerAmountTxt[jsonData["seat"].AsInt].text = ((int) jsonData["player_amount"].AsInt).ToString ();

    }

    private void OnUpdateBankerConnected (string jStr) {
        var jsonData = JSON.Parse (jStr);
        inGamePlayerChipsTxt.text = ((int) jsonData["balance"].AsInt).ToString ();
    }

    private void OnGetChipsConnected (string jStr) {
        var jsonData = JSON.Parse (jStr);
        menuChipsTxt.text = ((int) jsonData["total_chips"].AsInt).ToString ();
    }

    private void OnBetUpdateConnected (string jStr) {
        var jsonData = JSON.Parse (jStr);
        if (StartingValues.playing == "no") {
            if (jsonData["result"].AsInt == 0) {
                StartCoroutine (MoveToScore (playerBetTxt[jsonData["seat"].AsInt].transform.position, playerBetTxt[jsonData["banker"].AsInt].transform.position,
                    jsonData["seat"].AsInt, jsonData["bet"].AsInt, jsonData["bankerIn"].AsInt, jsonData["banker"].AsInt, jsonData["wAmount"].AsInt));
            } else if (jsonData["result"].AsInt != 0) {
                if (jsonData["bankerIn"].AsInt >= 0)
                    playerBetTxt[jsonData["banker"].AsInt].text = ((int) jsonData["bankerIn"].AsInt).ToString ();
                else
                    playerBetTxt[jsonData["banker"].AsInt].text = "0";
                StartCoroutine (MoveToScore2 (playerBetTxt[jsonData["seat"].AsInt].transform.position, playerBetTxt[jsonData["banker"].AsInt].transform.position,
                    jsonData["seat"].AsInt, jsonData["bet"].AsInt, jsonData["bankerIn"].AsInt, jsonData["banker"].AsInt, jsonData["wAmount"].AsInt,
                    jsonData["playerBetTot"].AsInt, jsonData["player_amount"].AsInt));
            }
        }
    }
    IEnumerator MoveToScore (Vector3 startPos, Vector3 endPos, int i, int bet, int bankerIn, int bseat, int wAmount) {
        float t = 0f;
        while (t < 1.0f) {
            playerBetTxt[i].transform.position = Vector3.Lerp (startPos, endPos, t);
            t += Time.deltaTime * 1;
            yield return null;
        }
        Vector3 vec = new Vector3 (playerBetSprite[i].transform.position.x, playerBetSprite[i].transform.position.y, playerBetSprite[i].transform.position.z);
        Vector3 screenPos = cam.WorldToScreenPoint (vec);
        playerBetTxt[i].transform.position = screenPos;
        playerBetTxt[i].text = "0";
        // StartCoroutine (AddDealerScore (bet, bankerIn, bseat, wAmount));
        playerBetTxt[bseat].text = ((int) bankerIn).ToString ();
    }
    IEnumerator AddDealerScore (int bet, int bankerIn, int bseat, int wAmount) {
        int t = wAmount;
        while (t < bankerIn) {
            playerBetTxt[bseat].text = t.ToString ();
            t += 50;
            yield return null;
        }
        playerBetTxt[bseat].text = bankerIn.ToString ();
    }
    IEnumerator MoveToScore2 (Vector3 startPos, Vector3 endPos, int i, int bet, int bankerIn, int bseat, int wAmount, int playerBetTot, int player_amount) {
        Vector3 vec = new Vector3 (playerBetSprite[bseat].transform.position.x, playerBetSprite[bseat].transform.position.y, playerBetSprite[bseat].transform.position.z);
        Vector3 screenPos = cam.WorldToScreenPoint (vec);
        loacalTxt.transform.position = screenPos;
        loacalTxt.text = wAmount.ToString ();
        loacalTxt.gameObject.SetActive (true);
        float t = 0f;
        while (t < 1.0f) {
            loacalTxt.transform.position = Vector3.Lerp (endPos, startPos, t);
            t += Time.deltaTime * 0.9f;
            yield return null;
        }
        loacalTxt.text = "";
        // StartCoroutine (AddDealerScore2 (i, bet, bankerIn, bseat, wAmount, playerBetTot));
        playerBetTxt[i].text = ((int) playerBetTot).ToString ();
        playerAmountTxt[i].text = ((int) (player_amount + playerBetTot)).ToString ();

    }
    IEnumerator AddDealerScore2 (int i, int bet, int bankerIn, int bseat, int wAmount, int playerBetTot) {
        int t = bet;
        while (t < playerBetTot) {
            playerBetTxt[i].text = t.ToString ();
            t += 50;
            yield return null;
        }
        print ("win " + playerBetTot);

    }

    public void ClickToggleOpen () {
        foreach (var obj in lobbiesObjects)
            Destroy (obj);
        lobbiesArr.Clear ();
        lobbiesObjects.Clear ();
        TestObject data = new TestObject ();
        data.shanID = StartingValues.GetShanID;
        socket.Emit ("GetShan", JsonUtility.ToJson (data));
        loadingScreen.gameObject.SetActive (true);
        loadingChe = true;
    }

    public void ClickGameList () {
        foreach (var obj in gameObjects)
            Destroy (obj);
        var go = EventSystem.current.currentSelectedGameObject;
        if (go.name == "Table") {
            for (int i = 0; i < tableGameList.Count; i++)
                OnGetGameListConnected (tableGameList[i]);
        } else if (go.name == "Spin") {
            for (int i = 0; i < spinGameList.Count; i++)
                OnGetGameListConnected (spinGameList[i]);
        } else if (go.name == "Slot") {
            for (int i = 0; i < slotGameList.Count; i++)
                OnGetGameListConnected (slotGameList[i]);
        } else if (go.name == "Dice") {
            for (int i = 0; i < diceGameList.Count; i++)
                OnGetGameListConnected (diceGameList[i]);
        } else if (go.name == "Fishing") {
            for (int i = 0; i < fishingGameList.Count; i++)
                OnGetGameListConnected (fishingGameList[i]);
        }
        for (int i = 0; i < 5; i++) {
            print (topGameBtn[i].name);
            if (go.name == topGameBtn[i].name)
                topGameBtn[i].GetComponent<Image> ().sprite = gameSprites[2].GetComponent<Image> ().sprite;
            else
                topGameBtn[i].GetComponent<Image> ().sprite = gameSprites[3].GetComponent<Image> ().sprite;
        }
    }
    private void ClickDefaultGameList () {
        foreach (var obj in gameObjects)
            Destroy (obj);
        for (int i = 0; i < tableGameList.Count; i++)
            OnGetGameListConnected (tableGameList[i]);
    }
    private void OnGetGameListConnected (string jStr) {
        GameObject obj = Instantiate (gameItemPrefab);
        obj.transform.SetParent (gameScrollContent.transform, false);
        obj.transform.Find ("name").gameObject.GetComponent<Text> ().text = jStr;
        if (jStr == "Shan Koe Mee")
            obj.transform.Find ("background").gameObject.GetComponent<Image> ().sprite = gameSprites[0].GetComponent<Image> ().sprite;
        else
            obj.transform.Find ("background").gameObject.GetComponent<Image> ().sprite = gameSprites[1].GetComponent<Image> ().sprite;
        Button button = obj.transform.Find ("play").gameObject.GetComponent<Button> ();
        button.onClick.AddListener (() => gameCallBack (jStr));
        gameObjects.Add (obj);

    }
    private void gameCallBack (string passStr) {
        if (passStr == "Shan Koe Mee") {
            StartingValues.pokerBackStr = "no";
            playPanel.gameObject.SetActive (false);
            playPanel.gameObject.SetActive (false);
            topBackBtn.gameObject.SetActive (true);
            topGameName.gameObject.SetActive (false);
            topGameNameTxt.text = passStr;
            TestObject data = new TestObject ();
            data.shanID = "2";
            socket.Emit ("GetShan", JsonUtility.ToJson (data));
            //ClickShanLevel ();
            loadingScreen.gameObject.SetActive (true);
            loadingChe = true;
        }
    }

    private void ClickShanLevel () {
        foreach (var obj in shanLevelObjects)
            Destroy (obj);
        shanLevelObjects.Clear ();
        for (int i = 0; i < shanLevelList.Count; i++)
            OnGetShanLevelConnected (shanLevelList[i], shanLevelDesList[i], i + 1);
    }
    private void OnGetShanLevelConnected (string jStr, string jStr2, int id) {
        //var jsonData = JSON.Parse (jStr);
        GameObject obj = Instantiate (shanLevelPrefab);
        obj.transform.SetParent (shanLevelScrollContent.transform, false);
        obj.transform.Find ("name").gameObject.GetComponent<Text> ().text = jStr;
        obj.transform.Find ("des").gameObject.GetComponent<Text> ().text = jStr2;
        Button button = obj.transform.Find ("play").gameObject.GetComponent<Button> ();
        button.onClick.AddListener (() => shanLevelCallBack (id, jStr));
        if (jStr == "LEVEL TWO")
            button.GetComponent<Image> ().sprite = gameSprites[2].GetComponent<Image> ().sprite;
        shanLevelObjects.Add (obj);
        loadingScreen.gameObject.SetActive (false);
        loadingChe = false;
    }
    private void shanLevelCallBack (int passId, string strName) {
        lobbiesArr.Clear ();
        foreach (var obj in lobbiesObjects)
            Destroy (obj);
        TestObject data = new TestObject ();
        data.shanID = passId.ToString ();
        socket.Emit ("GetShan", JsonUtility.ToJson (data));
        StartingValues.GetShanID = passId.ToString ();
        loadingScreen.gameObject.SetActive (true);
        loadingChe = true;

        foreach (var obj2 in shanLevelObjects) {
            Button button2 = obj2.transform.Find ("play").gameObject.GetComponent<Button> ();
            if (obj2.transform.Find ("name").gameObject.GetComponent<Text> ().text == strName)
                button2.GetComponent<Image> ().sprite = gameSprites[2].GetComponent<Image> ().sprite;
            else
                button2.GetComponent<Image> ().sprite = gameSprites[3].GetComponent<Image> ().sprite;
        }
    }
    public void clickTopBack () {
        playPanel.gameObject.SetActive (true);
        topBackBtn.gameObject.SetActive (false);
        topGameName.gameObject.SetActive (true);
        topGameNameTxt.text = "";

        TestObject data = new TestObject ();
        data.email = StartingValues.email;
        socket.Emit ("GetChips", JsonUtility.ToJson (data));

        foreach (var obj in shanLevelObjects)
            Destroy (obj);
        foreach (var obj in lobbiesObjects)
            Destroy (obj);
        shanLevelObjects.Clear ();
        lobbiesObjects.Clear ();
    }
    private void OnGetShanConnected (string jStr) {
        var jsonData = JSON.Parse (jStr);
        if (jsonData["result"].Value != "no") {
            int pValue = jsonData["players"].AsInt;
            bool ch2 = false;
            int iValue = 0;
            for (int i = 0; i < 4; i++) {
                if (!menuToggleBtn[i].isOn)
                    iValue += 1;
            }
            if (iValue == 4)
                ch2 = true;

            if (menuToggleBtn[0].isOn) {
                if (pValue == 0)
                    ch2 = true;
            }
            if (menuToggleBtn[1].isOn) {
                if (pValue == 1)
                    ch2 = true;
            }
            if (menuToggleBtn[2].isOn) {
                if (pValue == 2 || pValue == 3 || pValue == 4 || pValue == 5)
                    ch2 = true;
            }
            if (menuToggleBtn[3].isOn) {
                if (pValue == 6)
                    ch2 = true;
            }
            if (ch2) {
                lobbiesArr.Add (jStr);
                GameObject obj = Instantiate (scrollItemPrefab);
                obj.transform.SetParent (scrollContent.transform, false);
                obj.transform.Find ("PlayerIn").gameObject.GetComponent<Text> ().text = jsonData["points"].Value;
                obj.transform.Find ("BankerIn").gameObject.GetComponent<Text> ().text = jsonData["firstprize"].Value;
                obj.transform.Find ("BetLimit").gameObject.GetComponent<Text> ().text = ((jsonData["firstprize"].AsInt / 100) * 10).ToString ();
                obj.transform.Find ("Players").gameObject.GetComponent<Text> ().text = pValue + "/6";

                Button button = obj.transform.Find ("play").gameObject.GetComponent<Button> ();
                if (pValue == 0)
                    button.GetComponentInChildren<Text> ().text = "Open";
                else if (pValue == 1)
                    button.GetComponentInChildren<Text> ().text = "Waiting";
                else if (pValue >= 2 && pValue <= 5)
                    button.GetComponentInChildren<Text> ().text = "Running";
                else if (pValue == 6)
                    button.GetComponentInChildren<Text> ().text = "Full";
                button.onClick.AddListener (() => buttonCallBack (jsonData["id"].AsInt));
                lobbiesObjects.Add (obj);
            }
        }
        clickTableChe = true;
        loadingScreen.gameObject.SetActive (false);
        loadingChe = false;
    }

    private void buttonCallBack (int passValue) {
        for (int i = 0; i < lobbiesArr.Count; i++) {
            var jsonData = JSON.Parse (lobbiesArr[i]);
            if (jsonData["id"].AsInt == passValue) {
                inGameChe = true;
                findOtherPlayerChe = true;
                lobbyPanel.gameObject.SetActive (false);
                room = (jsonData["id"].AsInt);
                StartingValues.playerIn = jsonData["points"].AsInt;
                StartingValues.bankerIn = jsonData["firstprize"].AsInt;
                StartingValues.banker_amount = jsonData["firstprize"].AsInt;

                inGamePlayerNameTxt.text = StartingValues.username.ToString ();
                inGamePlayerChipsTxt.text = ((int) StartingValues.balance_amount).ToString ();
                inGameTableNameTxt.text = jsonData["lobbyName"].Value;
                inGamePlayerInTxt.text = "PlayerIn: " + StartingValues.playerIn.ToString ();
                inGameBankerInTxt.text = "BankerIn: " + StartingValues.bankerIn.ToString ();
                TestObject data2 = new TestObject ();
                data2.room = room.ToString ();
                data2.username = StartingValues.email;
                socket.Emit ("PlyingUser", JsonUtility.ToJson (data2));
                StartingValues.playing = "no";
            }
        }
    }

    private void buttonCallBack2 (int passValue) {
        TestObject data = new TestObject ();
        data.room = passValue.ToString ();
        socket.Emit ("FindRoomPlayer", JsonUtility.ToJson (data));
    }

    private void OnPlusBtnConnected (string jStr) {
        var jsonData = JSON.Parse (jStr);
        if (jsonData["status"].Value == "yes")
            playerSelectBtn[jsonData["seat"].AsInt].gameObject.SetActive (false);
        else if (jsonData["status"].Value == "no") {
            //playerSelectBtn[jsonData["seat"].AsInt].gameObject.SetActive (true);
        }
    }
    private void OnCHATConnected (string jStr) {
        var jsonData = JSON.Parse (jStr);
        chatBack[jsonData["seat"].AsInt].gameObject.SetActive (true);
        chatTxt[jsonData["seat"].AsInt].text = jsonData["message"].Value;
        StartCoroutine (chatMessageDisable (jsonData["seat"].AsInt));
    }

    private void OnRemovePlayerConnected (string jStr) {
        var jsonData = JSON.Parse (jStr);
        player[jsonData["seat"].AsInt].gameObject.SetActive (false);
        playerHalf[jsonData["seat"].AsInt].gameObject.SetActive (false);
        playerBetSprite[jsonData["seat"].AsInt].gameObject.SetActive (false);
        playerSelectBtn[jsonData["seat"].AsInt].gameObject.SetActive (true);
        playerEnable[jsonData["seat"].AsInt] = false;
        playerBetTxt[jsonData["seat"].AsInt].text = "";
        playerAmountTxt[jsonData["seat"].AsInt].text = "";
        playerNameTxt[jsonData["seat"].AsInt].text = "";

        inGamePlayerChipsTxt.text = ((int) StartingValues.balance_amount).ToString ();
    }

    private void OnRemoveBankerConnected (string jStr) {
        bankerObj.gameObject.SetActive (false);
    }
    private void OnResetGameConnected (string jStr) {
        resetGame ();
    }
    private void resetGame () {
        for (int i = 0; i < 6; i++) {
            playerHalf[i].GetComponent<SpriteRenderer> ().sprite = normalSprite.sprite;
            player[i].GetComponent<Renderer> ().material.color = new Color (1f, 1f, 1f, 1f);
            playerHalf[i].GetComponent<Renderer> ().material.color = new Color (1f, 1f, 1f, 1f);
            playerBetSprite[i].gameObject.SetActive (false);
            playerBetTxt[i].text = "";
            playerAmountTxt[i].text = "";
            playerNameTxt[i].text = "";
            playerStatusTxt[i].text = "";
            playerWinStatusTxt[i].text = "";
            playerX2StatusTxt[i].text = "";
            otherEnableChe[i] = false;
            bar[i].fillAmount = 0;
            playerCircleRotate[i].gameObject.SetActive (false);
            chatBack[i].gameObject.SetActive (false);
            scoreValueBack[i].gameObject.SetActive (false);
            scoreValueTxt[i].text = "";
        }
        if (!inGameChe)
            findOtherPlayerChe = false;
        for (int i = 0; i < mplt * 3; i++) {
            playerEnableChe[i] = false;
            cardPassed[i] = true;
            if (flipCards[i] != null)
                Destroy (flipCards[i]);
            if (cards[i] != null)
                Destroy (cards[i]);
        }
        flipCards = new GameObject[mplt * 3];
        cards = new GameObject[mplt * 3];
        betTimerChe = false;
        bar_value = 0;
        rotatingChe = false;
        bankerObj.gameObject.SetActive (false);
        playedSeat = -1;
        youPanelSlider.value = 0;
        selectSeatChe = false;

    }
    IEnumerator checkInternetConnection (string uri) {
        using (UnityWebRequest webRequest = UnityWebRequest.Get (uri)) {
            yield return webRequest.SendWebRequest ();
            string[] pages = uri.Split ('/');
            int page = pages.Length - 1;
            if (webRequest.isNetworkError) {
                if (ConnectChe) {
                    ConnectChe = false;
                    internetCheckPanel.gameObject.SetActive (true);
                }
                //Debug.Log (pages[page] + ": Error: " + webRequest.error);
            } else {
                if (!ConnectChe) {
                    internetCheckPanel.gameObject.SetActive (false);
                    ConnectChe = true;
                    //SceneManager.LoadScene ("MenuScene");
                }
                //Debug.Log (pages[page] + ":\nReceived: " + webRequest.downloadHandler.text);
            }
        }

        yield return new WaitForSecondsRealtime (2);
        StartCoroutine (checkInternetConnection ("http://google.com"));
    }
    public string GetHtmlFromUri (string resource) {
        string html = string.Empty;
        HttpWebRequest req = (HttpWebRequest) WebRequest.Create (resource);
        try {
            using (HttpWebResponse resp = (HttpWebResponse) req.GetResponse ()) {
                bool isSuccess = (int) resp.StatusCode < 299 && (int) resp.StatusCode >= 200;
                if (isSuccess) {
                    using (StreamReader reader = new StreamReader (resp.GetResponseStream ())) {
                        char[] cs = new char[80];
                        reader.Read (cs, 0, cs.Length);
                        foreach (char ch in cs) {
                            html += ch;
                        }
                    }
                }
            }
        } catch {
            return "";
        }
        return html;
    }

    public void ClickTeenpatti () {
        StartingValues.pokerBackStr = "no";
        playPanel.gameObject.SetActive (false);
    }

    public void ClickMenu () {
        setMenuPanel (true);
    }
    public void BackMenu3 () {
        setMenuPanel (false);
    }

    public void ClickChangeNumberCancel () {

    }
    public void ClickWallet () {

        setMenuPanel (false);
    }
    public void ClickWalletBack () {

    }
    public void ClickInviteFriends () {
        inviteCodeTxt.text = StartingValues.referral_code;
        setMenuPanel (false);
        InviteFriendsPanel.gameObject.SetActive (true);
    }

    public void ClickInviteFriendsBack () {
        InviteFriendsPanel.gameObject.SetActive (false);
    }
    public void ClickWithdrawMenu () {
        setMenuPanel (false);
        availableCashTxt.text = "Available Cash " + StartingValues.balance_amount.ToString ();
        //withdrawAvailablePanel.gameObject.SetActive (true);
        withdrawPanel.gameObject.SetActive (true);
        withdrawSectionValue = 0;
    }

    public void ClickPaytm () {
        withdrawSectionValue = 1;
        withdrawAvailablePanel.gameObject.SetActive (true);
        withPaytmObj.gameObject.SetActive (true);
    }
    public void ClickBankAccount () {
        withdrawSectionValue = 2;
        withdrawAvailablePanel.gameObject.SetActive (true);
        withBankObj.gameObject.SetActive (true);
    }
    public void ClickCheck () {
        withdrawSectionValue = 3;
        withdrawAvailablePanel.gameObject.SetActive (true);
        withCheckObj.gameObject.SetActive (true);
    }
    public void ClickWithDrawSubmit () {
        if (ConnectChe) {
            bool ch2 = true;
            string str = "";
            if (withdrawField.text == "") {
                ch2 = false;
                str = "Enter Cash";
            } else
            if (StartingValues.balance_amount < int.Parse (withdrawField.text)) {
                ch2 = false;
                str = "Cash not available";
            }
            if (withdrawSectionValue == 2) {
                paymentMethodStr = "Bank Account";
                if (BankNameField.text == "") {
                    ch2 = false;
                    str = "Bank Name is empty";
                } else if (AccountNumberField.text == "") {
                    ch2 = false;
                    str = "Account Number is empty";
                } else if (IFSCCodeField.text == "") {
                    ch2 = false;
                    str = "Ifsc Code is empty";
                }
            } else if (withdrawSectionValue == 1) {
                paymentMethodStr = "PayTM";
                if (paytmNumberField.text == "") {
                    ch2 = false;
                    str = "Need Paytm number";
                }
            } else if (withdrawSectionValue == 3) {
                paymentMethodStr = "Check";
                if (checkNameField.text == "") {
                    ch2 = false;
                    str = "Name is Empty";
                } else if (checkFatherNameField.text == "") {
                    ch2 = false;
                    str = "Father name is Empty";
                } else if (checkAddressField.text == "") {
                    ch2 = false;
                    str = "Address is Empty";
                }
            }

            if (!ch2) {
                withDrawStatusTxt.text = str;
            }
            if (ch2) {
                TestObject data = new TestObject ();
                string dateAndTimeVar = System.DateTime.Now.ToString ("dd/MM/yyyy HH:mm:ss");
                data.dateStr = dateAndTimeVar;
                data.username = StartingValues.username;
                data.email = StartingValues.email;
                data.withdrawAmt = withdrawField.text;
                data.balance_amount = withdrawField.text.ToString ();
                data.bankname = BankNameField.text;
                data.accountnumber = AccountNumberField.text;
                data.ifsc = IFSCCodeField.text;
                data.paytmNumber = paytmNumberField.text;
                data.method = paymentMethodStr;
                data.checkName = checkNameField.text;
                data.checkFatherName = checkFatherNameField.text;
                data.checkAddress = checkAddressField.text;
                socket.Emit ("Withdraw", JsonUtility.ToJson (data));
                withDrawStatusTxt.text = "Processing...";
            }
        }
    }
    public void ClickWithdrawCancel () {
        withPaytmObj.gameObject.SetActive (false);
        withdrawAvailablePanel.gameObject.SetActive (false);
        withCheckObj.gameObject.SetActive (false);
        withBankObj.gameObject.SetActive (false);
        withdrawSectionValue = 0;
    }
    public void ClickUserGuide () {
        setMenuPanel (false);
        rulesPanel.gameObject.SetActive (true);
    }
    public void clickLogout () {
        logoutPanel.gameObject.SetActive (true);
        //PlayerPrefs.SetString ("login", "fail");
    }
    public void clickOkLogout () {
        setMenuPanel (false);
#if UNITY_EDITOR
        UnityEditor.EditorApplication.ExitPlaymode ();
#else
        Application.Quit ();
#endif
        /*loginScreen.gameObject.SetActive (true);
        
        purchasePanel.gameObject.SetActive (false);
        statusTxt.text = "";
        registerPanel.gameObject.SetActive (false);
        loginScreenEnable = true;
        foreach (var obj in gameObjects)
            Destroy (obj);
        foreach (var obj in shanLevelObjects)
            Destroy (obj);
        foreach (var obj in lobbiesObjects)
            Destroy (obj);
        shanLevelObjects.Clear ();
        lobbiesObjects.Clear ();
        gameObjects.Clear ();
        logoutPanel.gameObject.SetActive (false);*/
    }
    public void clickCancelLogout () {
        logoutPanel.gameObject.SetActive (false);
    }
    public void ClickHelp () {
        string url = "https://codecanyon.net/item/teenpatti-chips-cash-game/28889675";
        Application.OpenURL (url);
    }
    public void ClickTerms () {
        string url = "https://codecanyon.net/item/teenpatti-chips-cash-game/28889675";
        Application.OpenURL (url);
    }

    public void Purchase100 () {
        string url = "http://codersboy.com/paymentmethod/teenpatti/razorpay/login2.php?email=" + StartingValues.email + "&pid=1";
        Application.OpenURL (url);
    }
    public void Purchase500 () {
        string url = "http://codersboy.com/paymentmethod/teenpatti/razorpay/login2.php?email=" + StartingValues.email + "&pid=2";
        Application.OpenURL (url);
    }
    public void Purchase1000 () {
        string url = "http://codersboy.com/paymentmethod/teenpatti/razorpay/login2.php?email=" + StartingValues.email + "&pid=3";
        Application.OpenURL (url);
    }

    private void OnCreateTableConnected (string jStr) {
        var jsonData = JSON.Parse (jStr);
        privateSuccessTxt.text = "Your Table ID is : " + jsonData["room_id"].Value;
        PrivateSuccessPanel.gameObject.SetActive (true);
    }
    public void ClickPrivateTable () {
        privateCreatePanel.gameObject.SetActive (false);
        privateTablePanel.gameObject.SetActive (true);
        privateTablePanel2.gameObject.SetActive (true);
        privateTablePriceTxt.text = "Private Table Price is " + StartingValues.privateTablePrice;
    }
    public void ClickPrivateTableBack () {
        privateTablePanel.gameObject.SetActive (false);

    }
    public void ClickCreateTable () {
        privateTableTypeDropdown.value = 0;
        privateTablePanel2.gameObject.SetActive (false);
        privateCreatePanel.gameObject.SetActive (true);
    }

    public void CreateTableCancel () {
        privateTablePanel2.gameObject.SetActive (true);
        privateCreatePanel.gameObject.SetActive (false);
    }
    public void CreateTableSubmit () {
        bool ch2 = true;
        string str = "";
        if (privateBootField.text == "") {
            ch2 = false;
            str = "Enter Boot Amount";
        } else if (privateMaxBlindField.text == "") {
            ch2 = false;
            str = "Enter Max Blinds";
        }
        if (StartingValues.balance_amount < StartingValues.privateTablePrice) {
            ch2 = false;
            str = "Cash Not available";
        }
        if (!ch2)
            privateStatusTxt.text = str;

        if (ch2) {
            TestObject data = new TestObject ();
            data.email = StartingValues.email;
            data.BootAmt = privateBootField.text;
            if (privateTableTypeDropdown.value == 0)
                data.tableType = "Limited";
            else if (privateTableTypeDropdown.value == 1)
                data.tableType = "Unlimited";

            data.ptprice = (StartingValues.balance_amount - StartingValues.privateTablePrice).ToString ();
            socket.Emit ("CreateTable", JsonUtility.ToJson (data));
            privateCreatePanel.gameObject.SetActive (false);
            privateTablePanel2.gameObject.SetActive (true);
        }
    }
    public void ClickSuccessOk () {
        privateBootField.text = "";
        privateMaxBlindField.text = "";
        ClickRefresh ();
        PrivateSuccessPanel.gameObject.SetActive (false);
    }
    public void ClickJoinRoom () {
        TestObject data = new TestObject ();
        data.room_id = roomIdField.text;
        socket.Emit ("JoinPrivateRoom", JsonUtility.ToJson (data));
    }

    private void OnJoinPrivateRoomConnected (string jStr) {
        var jsonData = JSON.Parse (jStr);
        if (jsonData["status"].Value == "yes") {
            lobbiesArr.Add (jStr);
            room = (jsonData["id"].AsInt);
            StartingValues.bootAmt = jsonData["BootValue"].AsInt;
            enterBootTxt.text = StartingValues.bootAmt.ToString ();
            joinPlayPanel.gameObject.SetActive (true);

        } else if (jsonData["status"].Value == "no") {
            privateSuccessTxt.text = "Room not available";
            PrivateSuccessPanel.gameObject.SetActive (true);
        }
    }
    public void ClickJoinPlay () {
        TestObject data = new TestObject ();
        data.room = room.ToString ();
        socket.Emit ("EnterRoom", JsonUtility.ToJson (data));

        privateTablePanel2.gameObject.SetActive (false);
        privateTablePanel.gameObject.SetActive (false);
        lobbyPanel.gameObject.SetActive (false);
        joinPlayPanel.gameObject.SetActive (false);
        privateStr = "yes";
    }
    public void ClickJoinPlayCancel () {
        joinPlayPanel.gameObject.SetActive (false);
        privateStr = "no";
    }
    public void ClickUpgradeApp () {
        Application.OpenURL (StartingValues.upgrade_url);
    }
    private void OnContinueSocketsConnected (string jStr) {
        if (!startConnectChe)
            startConnectChe = true;
        previousTime = System.DateTime.Now;

    }
    private void callContinueSockets () {
        if (tsSub.Seconds > 8) {
            if(startConnectChe){
                print ("internet fail");
                internetCheckPanel.gameObject.SetActive (true);
                reconnectChe = true;
            }
        } else {
            if (reconnectChe) {
                TestObject data = new TestObject ();
                data.email = StartingValues.email;
                socket.Emit ("JoinSocket", JsonUtility.ToJson (data));
                reconnectChe = false;
                internetCheckPanel.gameObject.SetActive (false);
            }
        }
        Debug.Log ("resume  List  " + tsSub.Seconds);
        
    }
    private void OnSocketActiveConnected (string jStr) {
        var jsonData = JSON.Parse (jStr);
        if (jsonData["active"].Value == "yes") { } else {

            //ClickBackMenu ();
        }
    }
    public void WhatsAppMe () {
        string url = "https://api.whatsapp.com/send?phone=(+91)9360651378&text=Hello";
        Application.OpenURL (url);
    }
}