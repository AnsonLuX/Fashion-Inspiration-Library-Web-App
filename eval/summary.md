# Evaluation Summary

## Setup
I collected a larger pool of fashion and street-style images for qualitative testing and created a smaller manually labeled subset for structured evaluation.

The labeled subset focuses on the following attributes:
- garmentType
- style
- material
- occasion
- locationContext.country

This evaluation run used 20 labeled images.

## Approach
Each labeled image was run through the multimodal classification pipeline, and predicted attributes were compared against manually defined expected labels.

Metrics:
- garmentType: exact match
- style/material/occasion: partial overlap match
- country: exact match when labeled

## Results
- garmentType accuracy: 80% (16/20)
- style accuracy: 95% (19/20)
- material accuracy: 84.6% (11/13)
- occasion accuracy: 20% (4/20)
- country accuracy: 10% (2/20)

## Observations
- Style performed best in this run, suggesting the model captures broad aesthetic cues reliably.
- Garment type was reasonably strong, but normalization issues still appeared in cases like `tuxedo` vs `tuxedo jacket`.
- Material was decent when texture was visible, but weaker when fabric cues were subtle or ambiguous.
- Occasion was much weaker because labels such as `daywear`, `everyday`, `casual`, and `formal event` often overlap semantically but not exactly.
- Country was the weakest attribute because most images do not provide strong geographic evidence, even when the model can infer fashion context well.

## If I Had More Time
- Expand the manually labeled subset
- Add confidence scoring per attribute
- Refine prompts for tighter garmentType normalization
- Add a normalization dictionary for synonyms such as `blazer` vs `suit jacket`
- Introduce softer evaluation rules for occasion and geography
