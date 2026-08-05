from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (
    BaseDocTemplate,
    Frame,
    PageBreak,
    PageTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
)


OUT = "C:/Users/kotas/Documents/Codex/2026-07-14/ko/outputs/nagoya_thermo_reference_2006_2024_embedded.pdf"


pdfmetrics.registerFont(TTFont("JPRegular", "C:/Windows/Fonts/yumin.ttf"))
pdfmetrics.registerFont(TTFont("JPBold", "C:/Windows/Fonts/yumindb.ttf"))


def on_page(canvas, doc):
    canvas.saveState()
    canvas.setFont("JPRegular", 8)
    canvas.setFillColor(colors.HexColor("#666666"))
    canvas.drawString(18 * mm, 12 * mm, "Nagoya Univ. Engineering Entrance Exam - Thermodynamics notes")
    canvas.drawRightString(192 * mm, 12 * mm, str(doc.page))
    canvas.restoreState()


doc = BaseDocTemplate(
    OUT,
    pagesize=A4,
    leftMargin=18 * mm,
    rightMargin=18 * mm,
    topMargin=17 * mm,
    bottomMargin=18 * mm,
)
frame = Frame(doc.leftMargin, doc.bottomMargin, doc.width, doc.height, id="normal")
doc.addPageTemplates([PageTemplate(id="main", frames=[frame], onPage=on_page)])

styles = getSampleStyleSheet()
S = {
    "title": ParagraphStyle(
        "title",
        parent=styles["Title"],
        fontName="JPBold",
        fontSize=20,
        leading=26,
        alignment=TA_CENTER,
        spaceAfter=8,
    ),
    "subtitle": ParagraphStyle(
        "subtitle",
        parent=styles["Normal"],
        fontName="JPRegular",
        fontSize=10.5,
        leading=16,
        alignment=TA_CENTER,
        textColor=colors.HexColor("#444444"),
        spaceAfter=16,
    ),
    "h1": ParagraphStyle(
        "h1",
        parent=styles["Heading1"],
        fontName="JPBold",
        fontSize=15,
        leading=20,
        spaceBefore=8,
        spaceAfter=6,
        textColor=colors.HexColor("#1f2937"),
    ),
    "h2": ParagraphStyle(
        "h2",
        parent=styles["Heading2"],
        fontName="JPBold",
        fontSize=12,
        leading=16,
        spaceBefore=7,
        spaceAfter=4,
        textColor=colors.HexColor("#334155"),
    ),
    "body": ParagraphStyle(
        "body",
        parent=styles["Normal"],
        fontName="JPRegular",
        fontSize=9.5,
        leading=15,
        spaceAfter=4,
    ),
    "small": ParagraphStyle(
        "small",
        parent=styles["Normal"],
        fontName="JPRegular",
        fontSize=8.2,
        leading=12,
        spaceAfter=2,
    ),
    "formula": ParagraphStyle(
        "formula",
        parent=styles["Normal"],
        fontName="JPBold",
        fontSize=9.2,
        leading=13,
        leftIndent=8,
        spaceBefore=2,
        spaceAfter=4,
        textColor=colors.HexColor("#111827"),
    ),
    "cell": ParagraphStyle(
        "cell",
        parent=styles["Normal"],
        fontName="JPRegular",
        fontSize=7.4,
        leading=10,
    ),
    "cell_b": ParagraphStyle(
        "cell_b",
        parent=styles["Normal"],
        fontName="JPBold",
        fontSize=7.5,
        leading=10,
    ),
}


def p(text, style="body"):
    return Paragraph(text, S[style])


def bullet(items):
    story = []
    for item in items:
        story.append(p("・" + item, "body"))
    return story


def formula(lines):
    return [p(line.replace(" ", "&nbsp;"), "formula") for line in lines]


def table(data, widths, header=True):
    rows = []
    for r, row in enumerate(data):
        rows.append([p(str(c), "cell_b" if r == 0 and header else "cell") for c in row])
    t = Table(rows, colWidths=widths, repeatRows=1 if header else 0)
    style = [
        ("GRID", (0, 0), (-1, -1), 0.35, colors.HexColor("#cbd5e1")),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 4),
        ("RIGHTPADDING", (0, 0), (-1, -1), 4),
        ("TOPPADDING", (0, 0), (-1, -1), 3),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
    ]
    if header:
        style += [
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#e5e7eb")),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.HexColor("#111827")),
        ]
    for i in range(1 if header else 0, len(data)):
        if i % 2 == 0:
            style.append(("BACKGROUND", (0, i), (-1, i), colors.HexColor("#f8fafc")))
    t.setStyle(TableStyle(style))
    return t


story = []

story += [
    p("名古屋大学 工学研究科 院試", "title"),
    p("熱力学 頻出ポイント・公式整理 2006-2024（18年分, 2020年を除く）", "subtitle"),
    p("このノートの使い方", "h1"),
    p(
        "過去問を読むと、名大の熱力学は「公式を知っているか」だけでなく、第一法則、第二法則、"
        "状態方程式、熱力学ポテンシャルから必要な関係をその場で組み立てられるかを強く見ています。"
        "特に近年は、ファン・デル・ワールス気体、Maxwell関係、エントロピー、熱伝導が濃く出ています。",
        "body",
    ),
]

story += bullet(
    [
        "最優先: 理想気体の状態変化、エントロピー、サイクル効率。",
        "次点: dU, dH, dF, dG から Maxwell 関係を導く力。",
        "近年対策: VDW気体、混合、熱伝導・熱伝達、開いた系のエネルギー式。",
        "古い年度対策: 流体機械と熱力学が混ざるので、ベルヌーイや運動量式も最低限押さえる。",
    ]
)

story += [
    p("1. 出題マップ", "h1"),
    table(
        [
            ["年度", "主題", "キーワード", "対策メモ"],
            ["2024", "VDW気体、混合、熱伝導", "内部エネルギー、エントロピー、断熱混合、多層壁", "非理想気体と熱抵抗の両方。近年型。"],
            ["2023", "開いた系、熱伝達", "定常流れ、第1法則、エントロピー生成、平板", "制御体積のエネルギー式を暗記でなく導く。"],
            ["2022", "T-sサイクル、エクセルギー", "再生、最大有効仕事", "熱効率と有効仕事の考え方。"],
            ["2021", "p-Vサイクル、相平衡、熱伝導", "エントロピー、Clapeyron型、断熱材", "相平衡でGibbs自由エネルギーが絡む。"],
            ["2019", "熱力学恒等式、VDW、音速", "Helmholtz/Gibbs、Maxwell、cp-cv", "自由エネルギー系の最重要年度。"],
            ["2018", "断熱関係、再生サイクル", "T v^(k-1)、p-V、再生", "理想気体サイクルの典型。"],
            ["2017", "VDW気体", "du/dv、cv、等温仕事、エントロピー", "2024と近い。"],
            ["2016", "回転流体、ピストン気体", "Bernoulli、断熱容器、エントロピー", "流体+閉じた系。"],
            ["2015", "開放系ポリトロープ", "工業仕事、熱量、n=0,gamma,1", "開いた系のポリトロープ整理。"],
            ["2014", "ピストン・発電機", "膨張仕事、発熱、エントロピー", "仕事が電気・熱へ行く設定。"],
            ["2013", "排水流れ、気体混合", "Bernoulli、異種気体混合、エントロピー", "混合エントロピー頻出。"],
            ["2012", "T-Vサイクル", "単原子理想気体、吸熱、効率", "グラフ読解の典型。"],
            ["2011", "VDW気体", "膨張率、圧縮率、熱圧係数、du/dV", "非理想気体の物性微分。"],
            ["2010", "不可逆サイクル", "自由膨張、Clausius不等式", "第二法則の説明力が必要。"],
            ["2009", "理想気体の基本関係", "内部エネルギー、T-S面積", "基礎の導出確認。"],
            ["2008", "気体混合、熱力学関係式", "du/dV式、混合後状態、エントロピー", "Maxwell系と混合の複合。"],
            ["2007", "ピストン・シリンダ", "等温、可逆断熱、p-V比較", "閉じた系の基礎型。"],
            ["2006", "水車、容器内気体", "Bernoulli、断熱容器への流入", "開いた系/非定常充填の考え方。"],
        ],
        [15 * mm, 42 * mm, 50 * mm, 56 * mm],
    ),
]

story += [
    PageBreak(),
    p("2. 最重要: 基本法則と状態量", "h1"),
    p("熱力学の問題は、ほぼすべて次の4本から組み立てられます。記号の符号規約は問題文に合わせて確認すること。", "body"),
]
story += formula(
    [
        "閉じた系:        dU = delta Q - delta W,     可逆なら delta W = p dV",
        "可逆単純圧縮系:  dU = T dS - p dV",
        "エンタルピー:    H = U + pV,      dH = T dS + V dp",
        "理想気体:        pV = nRT,        U = n c_v T,      H = n c_p T",
        "比熱関係:        c_p - c_v = R,   gamma = c_p / c_v",
    ]
)
story += [
    p("解法の型", "h2"),
]
story += bullet(
    [
        "閉じた系なら、まず境界仕事 W = integral p dV を考える。",
        "断熱なら Q=0。ただし可逆断熱か自由膨張かで結果は全く違う。",
        "開いた系なら、内部エネルギーではなく比エンタルピー h を中心に見る。",
        "エントロピーは状態量なので、不可逆過程でも同じ始終状態を結ぶ可逆経路で計算する。",
    ]
)

story += [
    p("3. 理想気体の状態変化", "h1"),
    p("2007, 2009, 2010, 2012, 2018, 2022で重要。p-V, T-S, T-V線図を見て、仕事・熱量・エントロピーを出せるようにする。", "body"),
    table(
        [
            ["過程", "成立条件/関係", "仕事・熱量・エントロピーの見方"],
            ["等温", "T=const, pV=const", "Delta U=0。可逆なら W=nRT ln(V2/V1), Q=W。"],
            ["等積", "V=const", "W=0。Q=Delta U=n c_v (T2-T1)。"],
            ["等圧", "p=const", "W=p(V2-V1)。Q=Delta H=n c_p (T2-T1)。"],
            ["可逆断熱", "pV^gamma=const, TV^(gamma-1)=const", "Q=0, Delta S=0。W=-Delta U。"],
            ["自由膨張", "Q=0, W=0", "理想気体なら Delta U=0, Delta T=0。ただし不可逆で Delta S>0。"],
            ["ポリトロープ", "pV^n=const", "n=0は等圧、n=1は等温、n=gammaは可逆断熱。"],
        ],
        [26 * mm, 55 * mm, 82 * mm],
    ),
]
story += [
    p("エントロピー変化の基本式", "h2"),
]
story += formula(
    [
        "Delta S = n c_v ln(T2/T1) + n R ln(V2/V1)",
        "Delta S = n c_p ln(T2/T1) - n R ln(p2/p1)",
        "可逆断熱: Delta S = 0,     不可逆断熱: Delta S > 0",
    ]
)

story += [
    p("4. サイクル問題の読み方", "h1"),
    p("サイクルは2010, 2012, 2018, 2021, 2022で強い。名大では、効率だけでなく、再生・不可逆性・T-S面積の意味を問うことがある。", "body"),
]
story += bullet(
    [
        "p-V線図: 囲まれた面積は正味仕事 W_net。",
        "T-S線図: 可逆過程なら面積 integral T dS が熱量 Q。",
        "熱効率: eta = W_net / Q_in = 1 - Q_out/Q_in。",
        "再生サイクル: 系内で熱を使い回す。外部からの Q_in と外部への Q_out がどう減るかを見る。",
        "不可逆サイクル: Clausius不等式 integral(delta Q/T) < 0 を説明に使う。",
    ]
)
story += [
    p("典型チェック", "h2"),
]
story += bullet(
    [
        "どの区間で吸熱しているか。放熱分を Q_in に混ぜない。",
        "断熱自由膨張は、p-V線上の準静的な線では表せない。",
        "T-S線図の縦線は等エントロピー、横線は等温ではなく温度一定線。",
    ]
)

story += [
    PageBreak(),
    p("5. 自由エネルギーと Maxwell 関係", "h1"),
    p("2019が最重要。2008, 2009, 2011, 2017, 2021, 2024にも関連がある。ここは「暗記」より、ポテンシャルの自然変数から機械的に導けるようにする。", "body"),
]
story += formula(
    [
        "U(S,V):       dU = T dS - p dV",
        "H(S,p):       H = U + pV,        dH = T dS + V dp",
        "F(T,V):       F = U - TS,        dF = -S dT - p dV",
        "G(T,p):       G = H - TS,        dG = -S dT + V dp",
    ]
)
story += [
    p("ここから出る Maxwell 関係", "h2"),
]
story += formula(
    [
        "from U:  (dT/dV)_S = -(dp/dS)_V",
        "from H:  (dT/dp)_S =  (dV/dS)_p",
        "from F:  (dS/dV)_T =  (dp/dT)_V",
        "from G:  (dS/dp)_T = -(dV/dT)_p",
    ]
)
story += [
    p("名大で特に使う恒等式", "h2"),
]
story += formula(
    [
        "(dU/dV)_T = T (dp/dT)_V - p",
        "c_p - c_v = T (dV/dT)_p (dp/dT)_V     （1 molなら体積 v で書く）",
        "alpha = (1/V)(dV/dT)_p,     kappa_T = -(1/V)(dV/dp)_T",
        "(dp/dT)_V = alpha / kappa_T",
    ]
)
story += [
    p("解法の型", "h2"),
]
story += bullet(
    [
        "まず何を自然変数にしたポテンシャルかを見る。Fなら(T,V)、Gなら(T,p)。",
        "全微分の係数を読む。例: dF=-S dT-p dV なので S=-(dF/dT)_V, p=-(dF/dV)_T。",
        "混合二階微分の交換から Maxwell 関係を出す。",
        "VDW気体では、状態方程式から (dp/dT)_V を先に計算し、恒等式へ代入する。",
    ]
)

story += [
    p("6. ファン・デル・ワールス気体", "h1"),
    p("2011, 2017, 2019, 2024で出ている。名大の非理想気体は、VDW状態方程式を微分して熱力学恒等式に代入する問題が多い。", "body"),
]
story += formula(
    [
        "1 mol:      (p + a/v^2)(v - b) = RT",
        "p = RT/(v-b) - a/v^2",
        "(dp/dT)_v = R/(v-b)",
        "(du/dv)_T = T R/(v-b) - p = a/v^2",
        "したがって u(T,v) = f(T) - a/v  （符号は基準の取り方に注意）",
    ]
)
story += bullet(
    [
        "理想気体では (du/dv)_T=0。VDWでは分子間相互作用のため0にならない。",
        "等温仕事は W = integral p dv。VDWなら RT ln(v-b) と a/v の項が出る。",
        "エントロピー変化は ds = c_v dT/T + (dp/dT)_v dv を使うとよい。",
    ]
)

story += [
    p("7. 混合・自由膨張・エントロピー生成", "h1"),
    p("2008, 2013, 2024で目立つ。断熱容器、仕切り除去、異種気体混合は頻出。不可逆でもエントロピーは状態量として計算する。", "body"),
]
story += formula(
    [
        "断熱・剛体容器:  Q=0, W=0 なので Delta U_total=0",
        "理想気体混合後:  p_final V_total = n_total R T_final",
        "同種理想気体の自由膨張: Delta S = nR ln(V2/V1)",
        "異種理想気体の混合: 各成分の Delta S_i を足す",
    ]
)
story += bullet(
    [
        "温度が違う気体の混合では、まず内部エネルギー保存から T_final を出す。",
        "圧力は最後に状態方程式で出す。",
        "エントロピー変化は、各気体について初期状態から最終状態への仮想可逆経路を置いて計算する。",
        "仕切りの位置依存を問う問題では、体積比がエントロピーに入る。",
    ]
)

story += [
    p("8. 開いた系・流体機械との接続", "h1"),
    p("2015, 2023が代表。古い年度では流体・熱力学の大問として、ベルヌーイ、ポンプ、水車、風車、ノズルが混ざる。熱力学としては比エンタルピーと工業仕事が核。", "body"),
]
story += formula(
    [
        "定常流れのエネルギー式:",
        "q - w_s = (h2-h1) + (V2^2-V1^2)/2 + g(z2-z1)",
        "運動・位置エネルギー無視:  q - w_s = h2 - h1",
        "理想気体: h2-h1 = c_p (T2-T1)",
        "工業仕事（可逆）: w_t = - integral v dp   （符号は問題文に合わせる）",
    ]
)
story += bullet(
    [
        "入口出口がある系では、UではなくHを使う理由を説明できるようにする。",
        "ポリトロープ p v^n=const の n=0, 1, gamma を整理する。",
        "ノズル/ディフューザでは、熱や軸仕事がなければ h + V^2/2 が保存される。",
        "流体機械の動力は、質量流量または体積流量を掛ける。",
    ]
)

story += [
    PageBreak(),
    p("9. 熱伝導・熱伝達", "h1"),
    p("2021, 2023, 2024で近年目立つ。熱力学だけでなく熱工学として問われる。熱抵抗の直列合成と、集中熱容量モデルを押さえる。", "body"),
]
story += formula(
    [
        "Fourier law:        q = -k A dT/dx",
        "平板定常伝導:       Qdot = k A (T1-T2)/L",
        "熱抵抗:             R_cond = L/(kA),     R_conv = 1/(hA)",
        "直列合成:           Qdot = (T_hot-T_cold) / sum R",
        "集中熱容量:         rho c V dT/dt = -h A (T - T_inf)",
        "(T-T_inf)/(T_i-T_inf) = exp[-hA t/(rho c V)]",
    ]
)
story += bullet(
    [
        "多層壁は電気抵抗の直列回路と同じように扱う。",
        "対流境界があると 1/(hA) が追加される。",
        "断熱材を追加して熱流束を半分にする問題では、追加後の全熱抵抗を2倍にする。",
        "非定常平板の薄い物体は、内部温度一様の近似が使われることがある。",
    ]
)

story += [
    p("10. 二相平衡・Clapeyron型", "h1"),
    p("2021で見られる。熱力学ポテンシャルとしてはGibbs自由エネルギーが中心。相平衡では化学ポテンシャルが等しい、という考え方に慣れる。", "body"),
]
story += formula(
    [
        "Gibbs: dG = -S dT + V dp",
        "単位質量/1 molで: dg = -s dT + v dp",
        "二相平衡: g_alpha = g_beta",
        "Clapeyron型: dp/dT = Delta s / Delta v = r / (T Delta v)",
    ]
)
story += bullet(
    [
        "蒸発潜熱 r が与えられたら、Delta s = r/T と置く。",
        "気相を理想気体、液相体積を無視、などの近似条件をよく読む。",
        "ln p と 1/T の関係を導く問題に注意。",
    ]
)

story += [
    p("11. 試験前チェックリスト", "h1"),
]
story += bullet(
    [
        "dU, dH, dF, dG の全微分を何も見ずに書ける。",
        "Maxwell関係を4つ導ける。",
        "(dU/dV)_T = T(dp/dT)_V - p を導けて、VDWへ代入できる。",
        "理想気体の等温・等圧・等積・可逆断熱・自由膨張の Q, W, Delta U, Delta S を出せる。",
        "p-V, T-S, T-V線図から、仕事・熱量・効率を読める。",
        "混合問題で、エネルギー保存から最終温度、状態方程式から最終圧力、仮想可逆経路からエントロピーを出せる。",
        "開いた系の式 q-w_s=Delta h+Delta(V^2/2)+gDelta z を使える。",
        "熱抵抗 R=L/kA, 1/hA を直列合成できる。",
    ]
)

story += [
    p("12. 優先演習順", "h1"),
    table(
        [
            ["優先", "テーマ", "狙い"],
            ["A", "2019, 2017, 2024のVDW/Maxwell", "近年頻出。自由エネルギーと恒等式の核。"],
            ["A", "2010, 2012, 2018, 2022のサイクル", "線図、効率、不可逆性をまとめて鍛える。"],
            ["A", "2008, 2013, 2024の混合", "エントロピー計算の実戦練習。"],
            ["B", "2021, 2023, 2024の熱伝導", "近年の熱工学対策。"],
            ["B", "2015, 2023の開いた系", "エンタルピーと工業仕事を固める。"],
            ["C", "古い年度の流体機械混合問題", "余裕があればベルヌーイ・運動量式も含めて確認。"],
        ],
        [20 * mm, 55 * mm, 88 * mm],
    ),
]

story += [
    Spacer(1, 8),
    p(
        "まとめ: 名大の熱力学は、基礎公式の暗記だけでは少し足りない。"
        "ただし出題の芯は毎年かなり安定していて、第一法則、エントロピー、サイクル、Maxwell関係、VDW、熱伝導を押さえれば戦いやすい。",
        "body",
    ),
]

doc.build(story)
print(OUT)
