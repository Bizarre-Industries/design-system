#!/usr/bin/env swift

import CoreGraphics
import Foundation
import ImageIO
import UniformTypeIdentifiers

enum QAError: Error, CustomStringConvertible {
    case invalidArguments
    case imageLoad(String)
    case context
    case crop
    case destination(String)

    var description: String {
        switch self {
        case .invalidArguments:
            return "Usage: image-qa.swift crop-top <input> <output> <height> | compare <left> <right> <output> <panel-width> <panel-height>"
        case .imageLoad(let path):
            return "Unable to load image: \(path)"
        case .context:
            return "Unable to create bitmap context"
        case .crop:
            return "Unable to crop image"
        case .destination(let path):
            return "Unable to write PNG: \(path)"
        }
    }
}

func load(_ path: String) throws -> CGImage {
    let url = URL(fileURLWithPath: path) as CFURL
    guard let source = CGImageSourceCreateWithURL(url, nil),
          let image = CGImageSourceCreateImageAtIndex(source, 0, nil) else {
        throw QAError.imageLoad(path)
    }
    return image
}

func write(_ image: CGImage, to path: String) throws {
    let url = URL(fileURLWithPath: path)
    try FileManager.default.createDirectory(at: url.deletingLastPathComponent(), withIntermediateDirectories: true)
    guard let destination = CGImageDestinationCreateWithURL(url as CFURL, UTType.png.identifier as CFString, 1, nil) else {
        throw QAError.destination(path)
    }
    CGImageDestinationAddImage(destination, image, nil)
    guard CGImageDestinationFinalize(destination) else { throw QAError.destination(path) }
}

func aspectFillSourceRect(image: CGImage, width: Int, height: Int) -> CGRect {
    let sourceAspect = CGFloat(image.width) / CGFloat(image.height)
    let targetAspect = CGFloat(width) / CGFloat(height)
    if sourceAspect > targetAspect {
        let cropWidth = CGFloat(image.height) * targetAspect
        return CGRect(x: (CGFloat(image.width) - cropWidth) / 2, y: 0, width: cropWidth, height: CGFloat(image.height))
    }
    let cropHeight = CGFloat(image.width) / targetAspect
    return CGRect(x: 0, y: (CGFloat(image.height) - cropHeight) / 2, width: CGFloat(image.width), height: cropHeight)
}

func compare(left: CGImage, right: CGImage, panelWidth: Int, panelHeight: Int) throws -> CGImage {
    let width = panelWidth * 2
    let colorSpace = CGColorSpace(name: CGColorSpace.sRGB)!
    guard let context = CGContext(
        data: nil,
        width: width,
        height: panelHeight,
        bitsPerComponent: 8,
        bytesPerRow: 0,
        space: colorSpace,
        bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue
    ) else { throw QAError.context }
    context.setFillColor(CGColor(red: 0.055, green: 0.055, blue: 0.055, alpha: 1))
    context.fill(CGRect(x: 0, y: 0, width: width, height: panelHeight))
    for (index, image) in [left, right].enumerated() {
        guard let cropped = image.cropping(to: aspectFillSourceRect(image: image, width: panelWidth, height: panelHeight)) else {
            throw QAError.crop
        }
        context.draw(cropped, in: CGRect(x: index * panelWidth, y: 0, width: panelWidth, height: panelHeight))
    }
    guard let output = context.makeImage() else { throw QAError.context }
    return output
}

do {
    let arguments = Array(CommandLine.arguments.dropFirst())
    guard let command = arguments.first else { throw QAError.invalidArguments }
    if command == "crop-top" {
        guard arguments.count == 4, let requestedHeight = Int(arguments[3]), requestedHeight > 0 else {
            throw QAError.invalidArguments
        }
        let image = try load(arguments[1])
        let height = min(requestedHeight, image.height)
        guard let cropped = image.cropping(to: CGRect(x: 0, y: 0, width: image.width, height: height)) else {
            throw QAError.crop
        }
        try write(cropped, to: arguments[2])
    } else if command == "compare" {
        guard arguments.count == 6,
              let panelWidth = Int(arguments[4]), panelWidth > 0,
              let panelHeight = Int(arguments[5]), panelHeight > 0 else {
            throw QAError.invalidArguments
        }
        let output = try compare(
            left: try load(arguments[1]),
            right: try load(arguments[2]),
            panelWidth: panelWidth,
            panelHeight: panelHeight
        )
        try write(output, to: arguments[3])
    } else {
        throw QAError.invalidArguments
    }
} catch {
    FileHandle.standardError.write(Data("\(error)\n".utf8))
    exit(1)
}
