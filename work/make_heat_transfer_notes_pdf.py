from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER
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


OUT = "C:/Users/kotas/Documents/Codex/2026-07-14/ko/outputs/nagoya_heat_transfer_notes.pdf"

pdfmetrics.registerFont(TTFont("JPRegular", "C:/Windows/Fonts/yumin.ttf"))
pdfmetrics.registerFont(TTFont("JPBold", "C:/Windows/Fonts/yumindb.ttf"))


def on_page(canvas, doc):
    canvas.saveState()
    canvas.setFont("JPRegular", 8)
    canvas.setFillColor(colors.HexColor("#666666"))
    canvas.drawString(18 * mm, 12 * mm, "Nagoya Univ. Heat Transfer Notes")
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
    "title": ParagraphStyle("title", parent=styles["Title"], fontName="JPBold", fontSize=19, leading=25, alignment=TA_CENTER, spaceAfter=8),
    "subtitle": ParagraphStyle("subtitle", parent=styles["Normal"], fontName="JPRegular", fontSize=10, leading=15, alignment=TA_CENTER, textColor=colors.HexColor("#444444"), spaceAfter=15),
    "h1": ParagraphStyle("h1", parent=styles["Heading1"], fontName="JPBold", fontSize=14, leading=19, spaceBefore=8, spaceAfter=5, textColor=colors.HexColor("#1f2937")),
    "h2": ParagraphStyle("h2", parent=styles["Heading2"], fontName="JPBold", fontSize=11.5, leading=15, spaceBefore=6, spaceAfter=3, textColor=colors.HexColor("#334155")),
    "body": ParagraphStyle("body", parent=styles["Normal"], fontName="JPRegular", fontSize=9.2, leading=14.2, spaceAfter=4),
    "formula": ParagraphStyle("formula", parent=styles["Normal"], fontName="JPBold", fontSize=8.8, leading=12.5, leftIndent=8, spaceAfter=3),
    "cell": ParagraphStyle("cell", parent=styles["Normal"], fontName="JPRegular", fontSize=7.2, leading=9.8),
    "cell_b": ParagraphStyle("cell_b", parent=styles["Normal"], fontName="JPBold", fontSize=7.3, leading=9.8),
}


def p(text, style="body"):
    return Paragraph(text, S[style])


def bullets(items):
    return [p("・" + x, "body") for x in items]


def formulas(lines):
    return [p(x.replace(" ", "&nbsp;"), "formula") for x in lines]


def table(data, widths):
    rows = []
    for r, row in enumerate(data):
        rows.append([p(str(c), "cell_b" if r == 0 else "cell") for c in row])
    t = Table(rows, colWidths=widths, repeatRows=1)
    t.setStyle(TableStyle([
        ("GRID", (0, 0), (-1, -1), 0.35, colors.HexColor("#cbd5e1")),
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#e5e7eb")),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 4),
        ("RIGHTPADDING", (0, 0), (-1, -1), 4),
        ("TOPPADDING", (0, 0), (-1, -1), 3),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
    ]))
    return t


story = []

story += [
    p("名古屋大学院試 伝熱工学まとめ", "title"),
    p("熱力学過去問に出る伝導・対流・熱抵抗・非定常の必要知識", "subtitle"),
    p("0. まず何が必要か", "h1"),
    p("過去問の伝熱は、凝った数値計算よりも、物理モデルを熱抵抗やエネルギー収支に落とす力を見ている。特に2021, 2023, 2024で、平板・多層壁・対流境界・非定常加熱冷却が重要。", "body"),
]
story += bullets([
    "最優先: Fourierの法則、熱流束、熱抵抗の直列合成。",
    "次点: 対流境界 h、全体熱通過率 U、断熱材の追加厚さ。",
    "近年対策: 薄い平板や物体の非定常冷却、集中熱容量モデル。",
    "余裕があれば: 円筒座標の伝導、フィン、放射の基礎。",
])

story += [
    p("1. 出題ポイント", "h1"),
    table([
        ["年度", "伝熱テーマ", "必要知識"],
        ["2024", "多層平板の1次元定常熱伝導", "Fourierの法則、各層の温度差、熱流束一定、熱抵抗直列"],
        ["2023", "平板の非定常/定常熱伝達", "集中熱容量、対流熱伝達率 h、時間応答、定常時の表面温度"],
        ["2021", "断熱材付き平板壁", "伝導+対流の熱抵抗、熱流束を半分にする断熱材厚さ"],
        ["2016以前", "熱単独より流体・熱力学との複合", "エネルギー式、仕事、熱量、管内流れとの接続"],
    ], [20 * mm, 55 * mm, 88 * mm]),
]

story += [
    p("2. 熱伝導の基本", "h1"),
    p("熱伝導は、温度差がある固体内部を熱が流れる現象。1次元定常なら、熱流束は各位置で一定になる。", "body"),
]
story += formulas([
    "Fourierの法則:        q_x = - k dT/dx",
    "熱流量:                Qdot = q_x A = - k A dT/dx",
    "平板, 定常, k一定:     Qdot = k A (T1 - T2) / L",
    "熱流束:                q = Qdot / A = k (T1 - T2) / L",
])
story += bullets([
    "kは熱伝導率。大きいほど熱を通しやすい。",
    "マイナス符号は、熱が高温から低温へ流れることを表す。",
    "試験では向きを自分で決め、熱流束qを正として温度差を書く方がミスりにくい。",
])

story += [
    p("3. 熱抵抗の考え方", "h1"),
    p("伝熱問題は電気回路の抵抗と同じ形で解けることが多い。温度差が電圧、熱流量が電流、熱抵抗が抵抗に対応する。", "body"),
]
story += formulas([
    "伝導抵抗:        R_cond = L / (k A)",
    "対流抵抗:        R_conv = 1 / (h A)",
    "熱流量:          Qdot = (T_hot - T_cold) / R_total",
    "熱流束基準:      q = (T_hot - T_cold) / R_total''",
    "面積あたり抵抗:  R_cond'' = L/k,     R_conv'' = 1/h",
])
story += [
    table([
        ["状況", "全熱抵抗"],
        ["平板1枚", "R = L/(kA)"],
        ["平板+左右に対流", "R = 1/(h1 A) + L/(kA) + 1/(h2 A)"],
        ["多層平板", "R = L1/(k1 A) + L2/(k2 A) + ..."],
        ["熱流束を半分にしたい", "全熱抵抗を2倍にする。追加断熱材の抵抗を逆算。"],
    ], [45 * mm, 118 * mm]),
]

story += [
    p("4. 多層平板の解法", "h1"),
    p("2024型。層が何枚あっても、定常1次元なら熱流束は全部の層で同じ。未知の界面温度は、各層の温度降下を足していけば出る。", "body"),
]
story += formulas([
    "q = (T0 - Tn) / (L1/k1 + L2/k2 + ... + Ln/kn)",
    "各層の温度降下:  Delta T_i = q L_i / k_i",
    "界面温度:        T_i = T_{i-1} - q L_i/k_i",
])
story += bullets([
    "面積が同じなら、面積Aは熱流束qで考えると消える。",
    "熱伝導率kが小さい層ほど温度降下が大きい。",
    "温度依存性なし、と書かれていればkは定数として積分不要。",
])

story += [
    p("5. 対流熱伝達", "h1"),
    p("固体表面と流体の間の熱移動。伝導と違って、表面温度と周囲流体温度の差に比例する形でモデル化される。", "body"),
]
story += formulas([
    "Newtonの冷却法則:      Qdot = h A (T_s - T_inf)",
    "熱流束:                q = h (T_s - T_inf)",
    "対流抵抗:              R_conv = 1/(hA)",
])
story += bullets([
    "T_sは固体表面温度、T_infは十分離れた流体温度。",
    "hが大きいほど表面から熱が逃げやすい。",
    "境界条件として、固体内の伝導熱流束と表面の対流熱流束を等置する。",
])

story += [
    p("6. 全体熱通過率 U", "h1"),
    p("伝導と対流が直列につながると、まとめて U A Delta T という形にできる。熱交換器や壁の問題で便利。", "body"),
]
story += formulas([
    "Qdot = U A Delta T",
    "1/(UA) = R_total",
    "平板壁:  1/U = 1/h1 + L/k + 1/h2     （面積一定）",
    "多層壁:  1/U = 1/h1 + L1/k1 + L2/k2 + ... + 1/h2",
])

story += [
    PageBreak(),
    p("7. 非定常伝熱: 集中熱容量モデル", "h1"),
    p("2023型。物体内部の温度差を無視できる薄い物体では、温度T(t)だけで扱う。熱収支は「内部エネルギー変化 = 対流で出入りする熱」。", "body"),
]
story += formulas([
    "rho c V dT/dt = - h A (T - T_inf)",
    "(T - T_inf)/(T_i - T_inf) = exp[- h A t / (rho c V)]",
    "時定数: tau = rho c V / (h A)",
])
story += bullets([
    "冷却ならTはT_infへ指数関数的に近づく。",
    "加熱でも式は同じで、T_infより低い初期温度なら上昇する。",
    "薄い平板、金属片、小さい物体などで出やすい。",
    "厳密にはBi = h L_c/k が小さいときに使う。目安は Bi < 0.1。",
])

story += [
    p("8. 境界条件の型", "h1"),
    table([
        ["境界条件", "式", "意味"],
        ["温度指定", "T = T_s", "表面温度が与えられる"],
        ["熱流束指定", "-k dT/dx = q_s", "入る/出る熱流束が与えられる"],
        ["断熱", "dT/dx = 0", "熱が通らない"],
        ["対流", "-k dT/dx = h(T_s - T_inf)", "表面から流体へ熱が逃げる"],
        ["接触界面", "T連続, q連続", "界面で温度と熱流束をつなぐ"],
    ], [30 * mm, 55 * mm, 78 * mm]),
]

story += [
    p("9. 円筒・球の伝導", "h1"),
    p("今回の過去問では平板が中心だが、参考書的には円筒も押さえると安心。半径方向では面積がrで変わるので、平板のL/kAをそのまま使わない。", "body"),
]
story += formulas([
    "円筒壁:      R_cyl = ln(r2/r1) / (2 pi k L)",
    "球殻:        R_sph = (1/(4 pi k)) (1/r1 - 1/r2)",
    "円筒対流:    R_conv = 1 / (h 2 pi r L)",
])
story += bullets([
    "管の断熱問題では円筒抵抗を使う。",
    "ただし名大の今回PDFでは、まず平板の直列熱抵抗を優先。",
])

story += [
    p("10. フィンの基礎", "h1"),
    p("過去問では濃くは出ていないが、伝熱工学の定番。表面積を増やして放熱する部材。微分方程式の形だけ知っておくとよい。", "body"),
]
story += formulas([
    "フィン方程式:  d^2 theta/dx^2 - m^2 theta = 0",
    "theta = T - T_inf,     m = sqrt(h P / (k A_c))",
    "長いフィン:    Qdot_f = sqrt(h P k A_c) (T_b - T_inf)",
])

story += [
    p("11. 放射伝熱の最低限", "h1"),
    p("今回の確認範囲では主役ではないが、熱工学として一応押さえる。高温物体では対流・伝導だけでなく放射が効く。", "body"),
]
story += formulas([
    "黒体放射:      E_b = sigma T^4",
    "実在面:        E = epsilon sigma T^4",
    "周囲との放射:  Qdot = epsilon sigma A (T_s^4 - T_sur^4)",
])
story += bullets([
    "Tは必ず絶対温度K。",
    "温度差が小さいときは線形化して h_rad A (T_s-T_sur) の形にできる。",
])

story += [
    p("12. 過去問を解くときの手順", "h1"),
]
story += bullets([
    "1. 定常か非定常かを判定する。",
    "2. 1次元か、多次元かを判定する。過去問ではほぼ1次元に落とせる。",
    "3. 伝導だけか、対流境界があるかを見る。",
    "4. 定常なら熱抵抗回路を書く。",
    "5. 非定常なら物体全体のエネルギー収支を書く。",
    "6. 最後に単位を確認する。qはW/m^2、QdotはW。",
])

story += [
    p("13. 暗記カード", "h1"),
    table([
        ["覚えるもの", "式"],
        ["Fourier", "Qdot = -kA dT/dx"],
        ["平板熱抵抗", "R = L/(kA)"],
        ["対流熱抵抗", "R = 1/(hA)"],
        ["熱流量", "Qdot = Delta T / R_total"],
        ["熱流束", "q = Delta T / R_total''"],
        ["Newton冷却", "Qdot = hA(T_s-T_inf)"],
        ["集中熱容量", "(T-T_inf)/(T_i-T_inf)=exp[-hAt/(rho c V)]"],
        ["円筒伝導", "R = ln(r2/r1)/(2 pi k L)"],
        ["放射", "Qdot = epsilon sigma A(T_s^4-T_sur^4)"],
    ], [48 * mm, 115 * mm]),
]

story += [
    Spacer(1, 8),
    p("結論: 名大の伝熱は、まず平板の熱抵抗と対流境界、次に集中熱容量モデルを固める。VDWやMaxwellほど派手ではないが、近年は熱力学大問の中に自然に混ざってくるので、取りこぼすともったいない。", "body"),
]

doc.build(story)
print(OUT)
